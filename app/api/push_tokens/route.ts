import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userRole = searchParams.get('user_role')
  const userId = searchParams.get('user_id')
  const userIds = searchParams.get('user_ids')

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
  const body = await request.json()
  const { user_id, user_role, token } = body

  // 같은 토큰 값이 이미 있으면 정리(기기 재등록 시 중복 방지). 같은 계정의 다른 기기 토큰은 유지.
  await supabaseAdmin.from('push_tokens').delete().eq('token', token)

  const { error } = await supabaseAdmin.from('push_tokens').insert({ user_id, user_role, token })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}