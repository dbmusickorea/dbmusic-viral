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
  const ids = searchParams.get('ids')
  const id = searchParams.get('id')
  const referredBy = searchParams.get('referred_by')
  const email = searchParams.get('email')
  const mobile = searchParams.get('mobile')
  const referralCode = searchParams.get('referral_code')
  const coverApproved = searchParams.get('cover_approved')

  let query = auth.client.from('participants').select('*').order('id', { ascending: false })

  if (id) query = query.eq('id', Number(id))
  else if (ids) query = query.in('id', ids.split(',').map(Number))
  else if (referredBy) query = query.eq('referred_by', referredBy)
  else query = query.eq('is_deleted', false)
  if (email) query = query.eq('email', email)
  if (mobile) query = query.eq('mobile', mobile)
  if (referralCode) query = query.eq('referral_code', referralCode)
  if (coverApproved === 'true') query = query.eq('cover_approved', true)
  if (coverApproved === 'false') query = query.eq('cover_approved', false).eq('is_cover_possible', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  let query = auth.client.from('participants').update(body)
  if (id) query = query.eq('id', id)
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

  // email 조회 후 auth 삭제
  const { data: participantData } = await supabaseAdmin.from('participants').select('email').eq('id', id!).single()
  if (participantData?.email) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u: any) => u.email === participantData.email)
    if (authUser) await supabaseAdmin.auth.admin.deleteUser(authUser.id)
  }

  const { error } = await auth.client.from('participants').delete().eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // 회원가입은 인증 불필요, service_role 사용
  const body = await request.json()
  const { error } = await supabaseAdmin.from('participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
