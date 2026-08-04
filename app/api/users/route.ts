import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAuth.auth.getUser(token)
  if (!user) return null
  const { data: userData } = await supabaseAdmin.from('users').select('role, id, client_id').eq('email', user.email).single()
  if (userData) return { role: userData.role, email: user.email, id: userData.id, clientId: userData.client_id }
  const { data: participant } = await supabaseAdmin.from('participants').select('id').eq('email', user.email).single()
  if (participant) return { role: 'participant', email: user.email, id: participant.id }
  return null
}

export async function GET(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const clientId = searchParams.get('client_id')
  const mobile = searchParams.get('mobile')
  const role = searchParams.get('role')
  const id = searchParams.get('id')

  // 체험단은 admin 목록만 조회 가능 (푸시 알림용)
  if (roleInfo.role === 'participant') {
    if (role === 'admin') {
      const { data, error } = await supabaseAdmin.from('users').select('id, name, email').eq('role', 'admin')
      if (error) return NextResponse.json({ error }, { status: 500 })
      return NextResponse.json(data ?? [])
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 의뢰인은 본인 정보만
  if (roleInfo.role === 'client') {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('client_id', roleInfo.clientId).single()
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(data ? [data] : [])
  }

  // 관리자는 전체 조회 가능
  let query = supabaseAdmin.from('users').select('*').eq('role', 'client').order('name', { ascending: true })
  if (email) query = supabaseAdmin.from('users').select('*').eq('email', email)
  else if (clientId) query = supabaseAdmin.from('users').select('*').eq('client_id', clientId)
  else if (mobile) query = supabaseAdmin.from('users').select('*').eq('mobile', mobile)
  else if (role) query = supabaseAdmin.from('users').select('*').eq('role', role)
  else if (id) query = supabaseAdmin.from('users').select('*').eq('id', id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  // 의뢰인은 본인만 수정 가능
  if (roleInfo.role === 'client') {
    if (id && Number(id) !== roleInfo.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin.from('users').update(body)
  if (id) query = query.eq('id', id)
  else if (clientId) query = query.eq('client_id', clientId)
  else if (email) query = query.eq('email', email)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 의뢰인은 본인만 삭제 가능
  if (roleInfo.role === 'client') {
    if (Number(id) !== roleInfo.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // 회원가입은 인증 불필요
  const body = await request.json()
  const { error } = await supabaseAdmin.from('users').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
