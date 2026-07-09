import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { phone, message, name, code, expiry } = await request.json()

  if (!phone) {
    return NextResponse.json({ error: 'phone required' }, { status: 400 })
  }

  const apiKey = process.env.SOLAPI_API_KEY!
  const apiSecret = process.env.SOLAPI_API_SECRET!
  const date = new Date().toISOString()
  const salt = Math.random().toString(36).substring(2)
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex')

  // 카카오 알림톡 발송 (대체발송 SMS 포함)
  const kakaoMessage: any = {
    to: phone,
    from: process.env.SOLAPI_SENDER!,
    kakaoOptions: {
      pfId: process.env.SOLAPI_KAKAO_PFID!,
      templateId: 'KA01TP2607080729444147DLp8YDtiD4',
      variables: {
        '#{고객명}': name || '고객',
        '#{code}': code || '',
        '#{유효시간}': expiry || '5분'
      },
      disableSms: false
    }
  }

  // 대체발송용 SMS 내용
  if (message) {
    kakaoMessage.text = message
  } else {
    kakaoMessage.text = `[더블비뮤직] 안녕하세요 ${name || '고객'}님, 인증번호는 ${code}입니다. 유효시간: ${expiry || '5분'}`
  }

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      message: kakaoMessage
    })
  })

  const data = await response.json()

  if (data.groupId || data.messageId) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: data.errorMessage || '발송 실패' })
  }
}