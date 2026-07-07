import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { phone, message } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message required' }, { status: 400 })
  }

  const apiKey = process.env.SOLAPI_API_KEY!
  const apiSecret = process.env.SOLAPI_API_SECRET!
  const date = new Date().toISOString()
  const salt = Math.random().toString(36).substring(2)
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex')

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      message: {
        to: phone,
        from: process.env.SOLAPI_SENDER!,
        text: message
      }
    })
  })

  const data = await response.json()

  if (data.groupId || data.messageId) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: data.errorMessage || '발송 실패' })
  }
}