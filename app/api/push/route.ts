import { NextRequest, NextResponse } from 'next/server'
import apn from 'node-apn'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const { title, body, tokens, userIds } = await request.json()

  if (!title || !body || !tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'title, body, tokens required' }, { status: 400 })
  }

  const keyData = process.env.APN_KEY
  if (!keyData) {
    return NextResponse.json({ error: 'APN_KEY not configured' }, { status: 500 })
  }

  const provider = new apn.Provider({
    token: {
      key: Buffer.from(keyData, 'base64'),
      keyId: process.env.APN_KEY_ID!,
      teamId: process.env.APN_TEAM_ID!,
    },
    production: true
  })

  const notification = new apn.Notification()
  notification.alert = { title, body }
  notification.sound = 'default'
  notification.topic = 'com.dbmusic.viral'

  const results = []
  for (const token of tokens) {
    const result = await provider.send(notification, token)
    results.push(result)
  }

  provider.shutdown()

  // notifications 테이블에 저장
  if (userIds && userIds.length > 0) {
    const notificationRows = userIds.map((userId: string) => ({
      user_id: userId,
      title,
      body
    }))
    await supabase.from('notifications').insert(notificationRows)
  }

  return NextResponse.json({ success: true, results })
}