import { NextRequest, NextResponse } from 'next/server'
import apn from 'node-apn'
import { createClient } from '@supabase/supabase-js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Firebase Admin 초기화
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT!, 'base64').toString()
  )
  initializeApp({
    credential: cert(serviceAccount)
  })
}

export async function POST(request: NextRequest) {
  const { title, body, tokens, userIds } = await request.json()

  if (!title || !body || !tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'title, body, tokens required' }, { status: 400 })
  }

  const results = []

  // iOS 토큰과 Android 토큰 분리 (iOS는 64자 hex, Android는 FCM 토큰)
  const iosTokens = tokens.filter((t: string) => /^[0-9a-f]{64}$/i.test(t))
  const androidTokens = tokens.filter((t: string) => !/^[0-9a-f]{64}$/i.test(t))

  // APNs (iOS) 발송
  if (iosTokens.length > 0) {
    const keyData = process.env.APN_KEY
    if (keyData) {
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

      for (const token of iosTokens) {
        const result = await provider.send(notification, token)
        results.push(result)
      }
      provider.shutdown()
    }
  }

  // FCM (Android) 발송
  if (androidTokens.length > 0) {
    for (const token of androidTokens) {
      try {
        const result = await getMessaging().send({
          token,
          notification: { title, body },
          android: {
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
          }
        })
        results.push({ success: true, result })
      } catch (error) {
        results.push({ error })
      }
    }
  }

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