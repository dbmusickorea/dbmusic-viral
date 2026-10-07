import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChatIdentity } from '../../lib/chatAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 서버 내부 호출(서비스 키) 또는 로그인한 회원만 허용
async function getCaller(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey && request.headers.get('authorization') === `Bearer ${serviceKey}`) {
    return { internal: true, me: null as any }
  }
  const me: any = await getChatIdentity(request)
  if (!me || !me.isMember) return null
  return { internal: false, me }
}

export async function GET(request: NextRequest) {
  const caller = await getCaller(request)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userRole = searchParams.get('user_role')
  const userId = searchParams.get('user_id')
  const userIds = searchParams.get('user_ids')

  // 조건 없이 전체 토큰을 가져가는 요청은 관리자/서버만 가능
  if (!userRole && !userId && !userIds && !caller.internal && !caller.me.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin.from('push_tokens').select('token, user_id, user_role')

  if (userRole) {
    const roles = userRole.split(',')
    if (roles.length > 1) {
      query = query.in('user_role', roles)
    } else {
      query = query.eq('user_role', userRole)
    }
  }
  if (userId) query = query.eq('user_id', userId)
  if (userIds) query = query.in('user_id', userIds.split(','))

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const caller = await getCaller(request)
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const user_id = body?.user_id != null ? String(body.user_id) : ''
  const user_role = body?.user_role != null ? String(body.user_role) : ''
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!user_id || !user_role || !token) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // 본인 계정으로만 토큰 등록 가능 (남의 id로 자기 기기를 등록해 알림을 가로채는 것 방지)
  if (!caller.internal) {
    const me = caller.me
    const ok =
      (me.isAdmin && user_role === 'admin') ||
      (user_role === 'participant' && me.participantId != null && String(me.participantId) === user_id) ||
      (user_role === 'client' && me.clientId != null && String(me.clientId) === user_id)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 같은 토큰 값이 이미 있으면 정리(기기 재등록 시 중복 방지). 같은 계정의 다른 기기 토큰은 유지.
  await supabaseAdmin.from('push_tokens').delete().eq('token', token)

  const { error } = await supabaseAdmin.from('push_tokens').insert({ user_id, user_role, token })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
