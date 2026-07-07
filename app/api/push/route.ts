import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { title, body, tokens } = await request.json()

  if (!title || !body || !tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'title, body, tokens required' }, { status: 400 })
  }

  // FCM V1 API 토큰 발급
  const { GoogleAuth } = await import('google-auth-library')
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })

  const accessToken = await auth.getAccessToken()

  const results = []
  for (const token of tokens) {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
          }
        })
      }
    )
    const data = await response.json()
    results.push(data)
  }

  return NextResponse.json({ success: true, results })
}