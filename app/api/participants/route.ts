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

  // 관리자/의뢰인 체크
  const { data: userData } = await supabaseAdmin.from('users').select('role').eq('email', user.email).single()
  if (userData) return { role: userData.role, email: user.email }

  // 체험단 체크
  const { data: participant } = await supabaseAdmin.from('participants').select('id, email').eq('email', user.email).single()
  if (participant) return { role: 'participant', email: user.email, id: participant.id }

  return null
}

export async function GET(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')
  const id = searchParams.get('id')
  const referredBy = searchParams.get('referred_by')
  const email = searchParams.get('email')
  const mobile = searchParams.get('mobile')
  const referralCode = searchParams.get('referral_code')
  const coverApproved = searchParams.get('cover_approved')

  let query = supabaseAdmin.from('participants').select('*').order('id', { ascending: false })

  // 체험단은 본인 데이터만
  if (roleInfo.role === 'participant') {
    query = query.eq('email', roleInfo.email)
  } else {
    if (id) query = query.eq('id', Number(id))
    else if (ids) query = query.in('id', ids.split(',').map(Number))
    else if (referredBy) query = query.eq('referred_by', referredBy)
    else query = query.eq('is_deleted', false)
    if (email) query = query.eq('email', email)
    if (mobile) query = query.eq('mobile', mobile)
    if (referralCode) query = query.eq('referral_code', referralCode)
    if (coverApproved === 'true') query = query.eq('cover_approved', true)
    if (coverApproved === 'false') query = query.eq('cover_approved', false).eq('is_cover_possible', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  // 체험단은 본인만 수정 가능
  if (roleInfo.role === 'participant') {
    if (email && email !== roleInfo.email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (id && Number(id) !== roleInfo.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin.from('participants').update(body)
  if (id) query = query.eq('id', id)
  else if (email) query = query.eq('email', email)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo || roleInfo.role === 'participant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin.from('participants').delete().eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // 회원가입은 인증 불필요
  const body = await request.json()
  const { error } = await supabaseAdmin.from('participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
