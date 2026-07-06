import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { phone, message } = await request.json()

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message required' }, { status: 400 })
  }

  const response = await fetch(
    `https://tbohdflubypnvlgwjxtp.supabase.co/functions/v1/smooth-responder`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ phone, message })
    }
  )

  const data = await response.json()

  if (data.result_code === '1') {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ success: false, error: data.message })
  }
}