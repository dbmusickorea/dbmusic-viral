import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChatIdentity } from '../../lib/chatAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getBadgeCountForUser(userId: string, role: string | null): Promise<number> {
  try {
    const { count: notifUnread } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (role === 'admin') {
      const [snsRes, coverRes, settleRes, chatRes] = await Promise.all([
        supabaseAdmin.from('sns_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('is_cover', true).eq('cover_status', 'PENDING'),
        supabaseAdmin.from('settlements').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabaseAdmin.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').is('read_at', null),
      ])
      const pending = (snsRes.count ?? 0) + (coverRes.count ?? 0) + (settleRes.count ?? 0) + (chatRes.count ?? 0)
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
    return 0
  }
}

export async function GET(request: NextRequest) {
  const me = await getChatIdentity(request)
  if (!me || !me.isMember) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  let role = searchParams.get('role')
  if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 })

  // 일반 사용자는 본인 것만, 관리자용 집계는 관리자만
  if (!me.isAdmin) {
    const own = [me.participantId, me.clientId].filter((v: any) => v != null).map(String)
    if (!own.includes(String(userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (role === 'admin') role = null
  }

  const count = await getBadgeCountForUser(userId, role)
  return NextResponse.json({ count })
}
