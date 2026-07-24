import { NextRequest, NextResponse } from 'next/server'
import apn from 'node-apn'
import { createClient } from '@supabase/supabase-js'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  const { title, body, tokens, userIds, saveToRole, data } = await request.json()

  if (!title || !body) {
    return NextResponse.json({ error: 'title, body required' }, { status: 400 })
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
      notification.badge = 1
      notification.payload = data ?? {}
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
          data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
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
  if (saveToRole) {
    const table = saveToRole === 'participant' ? 'participants' : 'users'
    const { data: allUsers } = await supabaseAdmin.from(table).select('id')
    const rows = allUsers?.map((u: any) => ({ user_id: String(u.id), title, body }))
    if (rows) await supabaseAdmin.from('notifications').insert(rows)
  } else if (userIds && userIds.length > 0) {
    const notificationRows = userIds.map((userId: string) => ({
      user_id: userId,
      title,
      body
    }))
    await supabaseAdmin.from('notifications').insert(notificationRows)
  }

  return NextResponse.json({ success: true, results })
}