import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'
import CryptoJS from 'crypto-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SECRET_KEY = process.env.ENCRYPT_KEY!

function decrypt(text: string): string {
  if (!text) return ''
  try {
    const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8) || ''
  } catch { return '' }
}

export async function GET(request: NextRequest) {
  const { data: settlements } = await supabaseAdmin
    .from('settlements')
    .select('*')
    .eq('status', 'APPROVED')
    .order('requested_at', { ascending: false })

  if (!settlements || settlements.length === 0) {
    return NextResponse.json({ error: '승인된 환전 내역이 없습니다.' }, { status: 404 })
  }

  const memberIds = settlements.map((s: any) => s.member_id)
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, name, bank_name, account_holder, account_number')
    .in('id', memberIds)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('환전 승인 내역')
  sheet.columns = [
    { header: '이름', width: 15 },
    { header: '은행명', width: 12 },
    { header: '예금주', width: 15 },
    { header: '계좌번호', width: 25 },
    { header: '주민번호', width: 20 },
    { header: '신청금액', width: 12 },
    { header: '실수령액', width: 12 },
    { header: '원천징수(3.3%)', width: 15 },
    { header: '신청일', width: 15 }
  ]
  sheet.getRow(1).font = { bold: true }

  for (const s of settlements) {
    const participant = participants?.find((p: any) => p.id === s.member_id)
    const accountNumber = decrypt(participant?.account_number ?? '')
    const residentNumber = decrypt(s.resident_number ?? '')

    sheet.addRow([
      participant?.name ?? '-',
      participant?.bank_name ?? '-',
      participant?.account_holder ?? '-',
      accountNumber || '-',
      residentNumber || '-',
      s.amount ?? 0,
      s.net_amount ?? 0,
      s.tax_amount ?? 0,
      new Date(s.requested_at).toLocaleDateString('ko-KR')
    ])
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="settlement_${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}