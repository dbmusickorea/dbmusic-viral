import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ChatIdentity = {
  authId: string
  isAdmin: boolean
  participantId: string | null
  clientId: string | null
  isMember: boolean
}

// 토큰으로 로그인한 계정을 확인하고, 채팅에서 쓰는 회원 id/역할로 변환
// (auth_id로 먼저 찾고, auth_id가 비어있는 옛 계정만 이메일로 보완)
export async function getChatIdentity(request: NextRequest): Promise<ChatIdentity | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null

  let participantId: string | null = null
  let clientId: string | null = null
  let isAdmin = false

  const { data: p1 } = await supabaseAdmin.from('participants').select('id').eq('auth_id', user.id).maybeSingle()
  let p = p1
  if (!p && user.email) {
    const { data: p2 } = await supabaseAdmin.from('participants').select('id').eq('email', user.email).is('auth_id', null).maybeSingle()
    p = p2
  }
  if (p) participantId = String(p.id)

  const { data: u1 } = await supabaseAdmin.from('users').select('id, role').eq('auth_id', user.id).maybeSingle()
  let u = u1
  if (!u && user.email) {
    const { data: u2 } = await supabaseAdmin.from('users').select('id, role').eq('email', user.email).is('auth_id', null).maybeSingle()
    u = u2
  }
  if (u) {
    if (u.role === 'admin') isAdmin = true
    else clientId = String(u.id)
  }

  return { authId: user.id, isAdmin, participantId, clientId, isMember: isAdmin || participantId !== null || clientId !== null }
}

// 본인 대화인지 (관리자 여부와 무관)
export function isOwnThread(me: ChatIdentity, userId: string | number, role: string): boolean {
  const id = String(userId)
  if (role === 'participant') return me.participantId === id
  if (role === 'client') return me.clientId === id
  return false
}

// 관리자이거나 본인 대화일 때 접근 가능
export function canAccessThread(me: ChatIdentity, userId: string | number, role: string): boolean {
  return me.isAdmin || isOwnThread(me, userId, role)
}
