import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const memberId = searchParams.get('member_id')

  let query = supabaseAdmin.from('client_requests').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  if (memberId) query = query.eq('member_id', memberId)
  const projectCode = searchParams.get('project_code')
  if (projectCode) query = query.eq('project_code', projectCode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('client_requests').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()

  const { error } = await supabaseAdmin.from('client_requests').update(body).eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}