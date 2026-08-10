import { NextRequest, NextResponse } from 'next/server'

const popbill = require('popbill')

popbill.config({
  LinkID: process.env.POPBILL_LINK_ID,
  SecretKey: process.env.POPBILL_SECRET_KEY,
  IsTest: false,
  IPRestrictOnOff: true,
  UseStaticIP: false,
  UseLocalTimeYN: true,
  defaultErrorHandler: (err: any) => console.error('Popbill Error:', err),
})

const accountCheckService = popbill.AccountCheckService()

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bankCode, accountNumber } = await req.json()

  if (!bankCode || !accountNumber) {
    return NextResponse.json({ error: '은행코드와 계좌번호는 필수입니다.' }, { status: 400 })
  }

  const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '')

  return new Promise<NextResponse>((resolve) => {
    accountCheckService.CheckAccountHolder(
      '2800202331',
      bankCode,
      cleanAccountNumber,
      (result: any) => {
        resolve(NextResponse.json({
          accountName: result.accountName,
          bankCode: result.bankCode,
          accountNumber: result.accountNumber,
          resultCode: result.resultCode,
          resultMessage: result.resultMessage,
        }))
      },
      (err: any) => {
        resolve(NextResponse.json({ error: err.message ?? '계좌 조회 실패' }, { status: 500 }))
      }
    )
  })
}
