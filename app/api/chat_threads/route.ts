import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: messages, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })

  // user_id + role 기준으로 그룹화
  const threadMap: Record<string, { user_id: string; role: string; last_message: string; last_sender: string; last_created_at: string; unread_count: number }> = {}

  for (const m of messages ?? []) {
    const key = `${m.role}_${m.user_id}`
    if (!threadMap[key]) {
      threadMap[key] = {
        user_id: m.user_id,
        role: m.role,
        last_message: m.body,
        last_sender: m.sender,
        last_created_at: m.created_at,
        unread_count: 0,
      }
    }
    if (m.sender === 'user' && !m.read_at) {
      threadMap[key].unread_count++
    }
  }

  const threads = Object.values(threadMap)

  // 이름 붙이기
  const participantIds = threads.filter(t => t.role === 'participant').map(t => t.user_id)
  const clientIds = threads.filter(t => t.role === 'client').map(t => t.user_id)

  const [participantsRes, usersRes] = await Promise.all([
    participantIds.length > 0 ? supabaseAdmin.from('participants').select('id, name').in('id', participantIds) : Promise.resolve({ data: [] }),
    clientIds.length > 0 ? supabaseAdmin.from('users').select('id, name').in('id', clientIds) : Promise.resolve({ data: [] }),
  ])

  const nameMap: Record<string, string> = {}
  for (const p of (participantsRes.data ?? [])) nameMap[`participant_${p.id}`] = p.name
  for (const u of (usersRes.data ?? [])) nameMap[`client_${u.id}`] = u.name

  const result = threads
    .map(t => ({ ...t, name: nameMap[`${t.role}_${t.user_id}`] ?? '(알 수 없음)' }))
    .sort((a, b) => new Date(b.last_created_at).getTime() - new Date(a.last_created_at).getTime())

  return NextResponse.json(result)
}
