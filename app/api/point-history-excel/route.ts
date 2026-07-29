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

  const now = new Date()
  const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('적립금 내역')

  // 제목 행
  sheet.addRow([`적립금 내역 (${dateStr} 기준)`])
  sheet.getRow(1).font = { bold: true, size: 14 }
  sheet.addRow([])

  sheet.columns = [
    { header: '이름', width: 15 },
    { header: '프로젝트 (가수/제목)', width: 30 },
    { header: '댓글미션', width: 12 },
    { header: '게시물', width: 12 },
    { header: '커버게시물', width: 12 },
    { header: '커버비용', width: 12 },
    { header: '친구추천', width: 12 },
    { header: '기타금액', width: 12 },
    { header: '기타메모', width: 25 },
    { header: '날짜', width: 20 }
  ]

  const headerRow = sheet.addRow(['이름', '프로젝트 (가수/제목)', '댓글미션', '게시물', '커버게시물', '커버비용', '친구추천', '기타금액', '기타메모', '날짜'])
  headerRow.font = { bold: true }

  for (const h of history ?? []) {
    const participant = participants?.find((p: any) => p.id === h.member_id)
    const memo = h.memo ?? ''

    const projectMatch = memo.match(/\((.+)\)/)
    const project = projectMatch ? projectMatch[1] : '-'

    let comment = 0, post = 0, coverPost = 0, coverFee = 0, referral = 0, etc = 0
    let etcMemo = ''

    if (memo.includes('댓글 미션')) comment = h.amount
    else if (memo.startsWith('커버 게시물')) coverPost = h.amount
    else if (memo.includes('커버영상 승인')) coverFee = h.amount
    else if (memo.includes('게시물')) post = h.amount
    else if (memo.includes('추천인') || memo.includes('추천')) referral = h.amount
    else { etc = h.amount; etcMemo = memo }

    const row = sheet.addRow([
      participant?.name ?? '-',
      project,
      comment || '',
      post || '',
      coverPost || '',
      coverFee || '',
      referral || '',
      etc || '',
      etcMemo,
      new Date(h.created_at).toLocaleString('ko-KR')
    ])

    ;[3,4,5,6,7,8].forEach(col => {
      const cell = row.getCell(col)
      if (cell.value) cell.numFmt = '#,##0'
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = encodeURIComponent(`적립금내역_${dateStr}.xlsx`)
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`
    }
  })
}
