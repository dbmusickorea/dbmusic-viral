import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChatIdentity } from '../../lib/chatAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const me = await getChatIdentity(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 대화방별 마지막 메시지/안 읽은 수는 DB 함수에서 집계 (전체 메시지를 읽지 않음)
  const { data: rows, error } = await supabaseAdmin.rpc('chat_thread_summary')
  if (error) return NextResponse.json({ error }, { status: 500 })

  const threads: { user_id: string; role: string; last_message: string; last_sender: string; last_created_at: string; unread_count: number }[] = (rows ?? []).map((r: any) => ({
    user_id: r.user_id as string,
    role: r.role as string,
    last_message: r.last_message as string,
    last_sender: r.last_sender as string,
    last_created_at: r.last_created_at as string,
    unread_count: Number(r.unread_count ?? 0),
  }))

  // 이름 붙이기
  const participantIds = threads.filter(t => t.role === 'participant').map(t => t.user_id)
  const clientIds = threads.filter(t => t.role === 'client').map(t => t.user_id)

  const [participantsRes, usersRes] = await Promise.all([
    participantIds.length > 0 ? supabaseAdmin.from('participants').select('id, name, last_login_at').in('id', participantIds) : Promise.resolve({ data: [] }),
    clientIds.length > 0 ? supabaseAdmin.from('users').select('id, name, last_login_at').in('id', clientIds) : Promise.resolve({ data: [] }),
  ])

  const nameMap: Record<string, string> = {}
  const lastLoginMap: Record<string, string | null> = {}
  for (const p of (participantsRes.data ?? [])) { nameMap[`participant_${p.id}`] = p.name; lastLoginMap[`participant_${p.id}`] = p.last_login_at ?? null }
  for (const u of (usersRes.data ?? [])) { nameMap[`client_${u.id}`] = u.name; lastLoginMap[`client_${u.id}`] = u.last_login_at ?? null }

  const result = threads
    .map(t => ({ ...t, name: nameMap[`${t.role}_${t.user_id}`] ?? '(알 수 없음)', last_login_at: lastLoginMap[`${t.role}_${t.user_id}`] ?? null }))
    .sort((a, b) => new Date(b.last_created_at).getTime() - new Date(a.last_created_at).getTime())

  return NextResponse.json(result)
}
