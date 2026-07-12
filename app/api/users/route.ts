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

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const body = await request.json()

  const { error } = await supabaseAdmin
    .from('users')
    .update(body)
    .eq('client_id', clientId!)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}