import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    return 0
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const role = searchParams.get('role')
  if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 })

  const count = await getBadgeCountForUser(userId, role)
  return NextResponse.json({ count })
}
