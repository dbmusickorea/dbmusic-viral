import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { phone, message } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message required' }, { status: 400 })
  }

  const params = new URLSearchParams({
    key: process.env.ALIGO_API_KEY!,
    user_id: process.env.ALIGO_USER_ID!,
    sender: process.env.ALIGO_SENDER!,
    receiver: phone,
    msg: message,
    msg_type: 'SMS'
  })

  const response = await fetch('https://apis.aligo.in/send/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  const data = await response.json()

  if (data.result_code === '1') {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: data.message })
  }
}