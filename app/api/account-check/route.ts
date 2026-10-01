import { NextRequest, NextResponse } from 'next/server'

const BOLTA_API_URL = 'https://xapi.bolta.io/v1/bankAccountHolders:inquire'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bankCode, accountNumber } = await req.json()

  if (!bankCode || !accountNumber) {
    return NextResponse.json({ error: '은행코드와 계좌번호는 필수입니다.' }, { status: 400 })
  }

  const cleanBankCode = bankCode.replace(/[^0-9]/g, '').padStart(3, '0')
  const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '')

  const apiKey = process.env.BOLTA_API_KEY
  if (!apiKey) {
    console.error('BOLTA_API_KEY is not set')
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
  }

  const authToken = Buffer.from(`${apiKey}:`).toString('base64')

  try {
    const boltaRes = await fetch(BOLTA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify({
        bankCode: cleanBankCode,
        accountNumber: cleanAccountNumber,
      }),
    })

    const data = await boltaRes.json()

    if (!boltaRes.ok) {
      console.error('Bolta Error:', data)
      return NextResponse.json({ error: data.message ?? '계좌 조회 실패' }, { status: boltaRes.status })
    }

    return NextResponse.json({
      accountName: data.holderName,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber,
      resultCode: 'SUCCESS',
      resultMessage: '조회 성공',
    })
  } catch (err: any) {
    console.error('Bolta Error:', err)
    return NextResponse.json({ error: err.message ?? '계좌 조회 실패' }, { status: 500 })
  }
}
