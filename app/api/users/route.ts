import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return { client, user }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const clientId = searchParams.get('client_id')
  const mobile = searchParams.get('mobile')
  const role = searchParams.get('role')
  const id = searchParams.get('id')

  let query = auth.client.from('users').select('*')

  if (email) query = query.eq('email', email)
  else if (clientId) query = query.eq('client_id', clientId)
  else if (mobile) query = query.eq('mobile', mobile)
  else if (role) query = query.eq('role', role)
  else if (id) query = query.eq('id', id)
  else query = query.eq('role', 'client').order('name', { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  // 이메일 변경 시 Supabase Auth(실제 로그인 계정)도 동기화
  if (body.email && id) {
    const { data: existing } = await supabaseAdmin.from('users').select('auth_id, email').eq('id', id).maybeSingle()
    if (existing?.auth_id && existing.email !== body.email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(existing.auth_id, {
        email: body.email,
        email_confirm: true
      })
      if (authUpdateError) {
        return NextResponse.json({ error: `인증 이메일 수정 실패: ${authUpdateError.message}` }, { status: 500 })
      }
    }
  }

  let query = auth.client.from('users').update(body)
  if (id) query = query.eq('id', id)
  else if (clientId) query = query.eq('client_id', clientId)
  else if (email) query = query.eq('email', email)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 완전 삭제 대신 비활성화 처리 (법적 5년 보관 의무)
  const { error } = await supabaseAdmin.from('users').update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    name: '탈퇴한 사용자',
    phone: null,
    mobile: null,
  }).eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // 회원가입은 인증 불필요, service_role 사용
  const body = await request.json()
  const { error } = await supabaseAdmin.from('users').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
