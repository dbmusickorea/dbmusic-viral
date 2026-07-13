import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  let query = supabaseAdmin.from('users').select('*').eq('role', 'client').order('name', { ascending: true })
  
  if (email) {
    query = supabaseAdmin.from('users').select('*').eq('email', email)
  }
  const clientId = searchParams.get('client_id')
  if (clientId) {
    query = supabaseAdmin.from('users').select('*').eq('client_id', clientId)
  }
  const mobile = searchParams.get('mobile')
  if (mobile) {
    query = supabaseAdmin.from('users').select('*').eq('mobile', mobile)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  let query = supabaseAdmin.from('users').update(body)
  if (id) query = query.eq('id', id)
  else if (clientId) query = query.eq('client_id', clientId)
  else if (email) query = query.eq('email', email)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('users').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}