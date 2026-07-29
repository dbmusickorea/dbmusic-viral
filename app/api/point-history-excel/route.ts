import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: history } = await supabaseAdmin
    .from('point_history')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, name')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('적립금 내역')
  sheet.columns = [
    { header: '이름', width: 15 },
    { header: '프로젝트 (가수/제목)', width: 30 },
    { header: '댓글미션', width: 12 },
    { header: '게시물', width: 12 },
    { header: '커버', width: 12 },
    { header: '친구추천', width: 12 },
    { header: '기타', width: 12 },
    { header: '날짜', width: 20 }
  ]
  sheet.getRow(1).font = { bold: true }

  for (const h of history ?? []) {
    const participant = participants?.find((p: any) => p.id === h.member_id)
    const memo = h.memo ?? ''

    // 프로젝트 정보 추출
    const projectMatch = memo.match(/\((.+)\)/)
    const project = projectMatch ? projectMatch[1] : '-'

    // 금액 분류
    let comment = 0, post = 0, cover = 0, referral = 0, etc = 0
    if (memo.includes('댓글 미션')) comment = h.amount
    else if (memo.includes('커버 게시물')) cover = h.amount
    else if (memo.includes('게시물')) post = h.amount
    else if (memo.includes('추천인') || memo.includes('추천')) referral = h.amount
    else etc = h.amount

    sheet.addRow([
      participant?.name ?? '-',
      project,
      comment || '',
      post || '',
      cover || '',
      referral || '',
      etc || '',
      new Date(h.created_at).toLocaleString('ko-KR')
    ])
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="point_history_${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}
