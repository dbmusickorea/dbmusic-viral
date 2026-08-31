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

// 특정 사용자(user_id, role)의 정확한 뱃지 숫자 계산
async function getBadgeCountForUser(userId: string, role: string | null): Promise<number> {
  try {
    const { count: notifUnread } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (role === 'admin') {
      const [snsRes, coverRes, settleRes, coverAddReqRes, chatRes] = await Promise.all([
        supabaseAdmin.from('sns_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('is_cover', true).eq('cover_status', 'PENDING'),
        supabaseAdmin.from('settlements').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('client_requests').select('id', { count: 'exact', head: true }).eq('title', '커버 체험단 추가 요청').eq('status', 'PENDING'),
        supabaseAdmin.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').is('read_at', null),
      ])
      const pending = (snsRes.count ?? 0) + (coverRes.count ?? 0) + (settleRes.count ?? 0) + (coverAddReqRes.count ?? 0) + (chatRes.count ?? 0)
      return pending + (notifUnread ?? 0)
    } else {
      const { count: chatUnread } = await supabaseAdmin
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('sender', 'admin')
        .is('read_at', null)
      return (chatUnread ?? 0) + (notifUnread ?? 0)
    }
  } catch (e) {
    console.error('뱃지 계산 실패:', e)
    return 1
  }
}

export async function POST(request: NextRequest) {
  const { title, body, tokens, userIds, saveToRole, data, skipNotificationSave } = await request.json()
  
  const autoData = data ?? (saveToRole === 'participant' ? { url: '/participant' } : saveToRole === 'client' ? { url: '/client' } : {})

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

      // 토큰별 소유자(user_id, role) 조회
      const { data: tokenOwners } = await supabaseAdmin
        .from('push_tokens')
        .select('token, user_id, user_role')
        .in('token', iosTokens)
      const ownerMap: Record<string, { user_id: string; user_role: string | null }> = {}
      for (const o of tokenOwners ?? []) ownerMap[o.token] = { user_id: o.user_id, user_role: o.user_role }

      for (const token of iosTokens) {
        const owner = ownerMap[token]
        const badgeCount = owner ? await getBadgeCountForUser(owner.user_id, owner.user_role) : 1

        const notification = new apn.Notification()
        notification.alert = { title, body }
        notification.sound = 'default'
        notification.badge = badgeCount
        notification.payload = { data: autoData }
        notification.topic = 'com.dbmusic.viral'

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
          data: Object.fromEntries(Object.entries(autoData).map(([k, v]) => [k, String(v)])),
          android: {
            notification: {
              sound: 'default',
            },
            priority: 'high',
          },
        })
        results.push({ success: true, result })
      } catch (error) {
        results.push({ error })
      }
    }
  }

  // notifications 테이블에 저장
  if (skipNotificationSave) {
    // 채팅 등, 별도 화면에 이미 저장되는 경우 알림함에는 중복 저장하지 않음
  } else if (saveToRole) {
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