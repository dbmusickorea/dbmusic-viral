import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
  const clientId = searchParams.get('client_id')

  let query = auth.client.from('distribution_withdrawals').select('*').order('requested_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, amount, bank_name, account_holder, account_number } = body
  if (!client_id || !amount) return NextResponse.json({ error: 'client_id, amount 필요' }, { status: 400 })

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
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()

  if (body.status === 'APPROVED') {
    const { data: w } = await supabaseAdmin.from('distribution_withdrawals').select('*').eq('id', id).maybeSingle()
    if (w) {
      const { data: userRow } = await supabaseAdmin.from('users').select('distribution_balance').eq('client_id', w.client_id).maybeSingle()
      const newBalance = (userRow?.distribution_balance ?? 0) - w.amount
      await supabaseAdmin.from('users').update({ distribution_balance: newBalance }).eq('client_id', w.client_id)
    }
  }

  const { error } = await supabaseAdmin
    .from('distribution_withdrawals')
    .update({ ...body, processed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
