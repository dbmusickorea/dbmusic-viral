import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('project_participants').select('*').order('joined_at', { ascending: false })

  if (projectCode) query = query.ilike('project_code', projectCode)
  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('project_participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const memberId = searchParams.get('member_id')
  const body = await request.json()

  let query = supabaseAdmin.from('project_participants').update(body)
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (memberId) query = query.eq('member_id', memberId)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}