import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 요청자 확인: users 행(id, role, client_id). auth_id 우선, auth_id가 비어있는 행만 이메일로 보조 매칭
async function getMe(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null

  const byAuth = await supabaseAdmin.from('users').select('id, role, client_id').eq('auth_id', user.id).maybeSingle()
  if (byAuth.data) return byAuth.data as { id: number; role: string | null; client_id: string | null }
  if (user.email) {
    const byEmail = await supabaseAdmin.from('users').select('id, role, client_id').eq('email', user.email).is('auth_id', null).maybeSingle()
    if (byEmail.data) return byEmail.data as { id: number; role: string | null; client_id: string | null }
  }
  return null
}

export async function GET(request: NextRequest) {
  const me = await getMe(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = me.role === 'admin'

  const clientId = new URL(request.url).searchParams.get('client_id')
  let query = supabaseAdmin.from('distribution_withdrawals').select('*').order('requested_at', { ascending: false })

  if (isAdmin) {
    if (clientId) query = query.eq('client_id', clientId)
  } else {
    if (!me.client_id || (clientId && clientId !== me.client_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    query = query.eq('client_id', me.client_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const me = await getMe(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = me.role === 'admin'

  const body = await request.json()
  const { client_id, amount, bank_name, account_holder, account_number } = body
  if (!client_id || !amount) return NextResponse.json({ error: 'client_id, amount 필요' }, { status: 400 })
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: '출금 금액이 올바르지 않아요.' }, { status: 400 })
  if (!isAdmin && client_id !== me.client_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isAdmin && process.env.REQUIRE_IDENTITY === 'true') {
    const { data: v } = await supabaseAdmin.from('users').select('is_verified').eq('client_id', client_id).maybeSingle()
    if (!v?.is_verified) return NextResponse.json({ error: '본인인증이 필요해요.', code: 'NOT_VERIFIED' }, { status: 403 })
  }

  const { data: pending } = await supabaseAdmin
    .from('distribution_withdrawals')
    .select('id')
    .eq('client_id', client_id)
    .eq('status', 'PENDING')
    .maybeSingle()
  if (pending) return NextResponse.json({ error: '이미 진행중인 출금 신청이 있어요.' }, { status: 409 })

  const { data: userRow } = await supabaseAdmin.from('users').select('distribution_balance').eq('client_id', client_id).maybeSingle()
  const balance = userRow?.distribution_balance ?? 0
  if (amount > balance) return NextResponse.json({ error: '잔액이 부족해요.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('distribution_withdrawals')
    .insert({ client_id, amount, bank_name, account_holder, account_number, status: 'PENDING' })
    .select()
    .single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const me = await getMe(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })
  const body = await request.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // 신청 정보 자체(금액/대상/신청시각)는 수정 불가
  for (const k of ['id', 'client_id', 'amount', 'requested_at']) delete body[k]

  const { data: w } = await supabaseAdmin.from('distribution_withdrawals').select('*').eq('id', id).maybeSingle()
  if (!w) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.status === 'APPROVED') {
    if (w.status === 'APPROVED') return NextResponse.json({ error: '이미 승인된 건이에요.' }, { status: 409 })
    const { data: userRow } = await supabaseAdmin.from('users').select('distribution_balance').eq('client_id', w.client_id).maybeSingle()
    const newBalance = (userRow?.distribution_balance ?? 0) - w.amount
    if (newBalance < 0) return NextResponse.json({ error: '잔액이 부족해서 승인할 수 없어요.' }, { status: 400 })
    const { error: balErr } = await supabaseAdmin.from('users').update({ distribution_balance: newBalance }).eq('client_id', w.client_id)
    if (balErr) return NextResponse.json({ error: balErr }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('distribution_withdrawals')
    .update({ ...body, processed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
