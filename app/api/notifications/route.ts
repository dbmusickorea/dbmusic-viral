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
  const { data: userData } = await supabaseAdmin.from('users').select('role').eq('email', user.email).single()
  if (userData) return { role: userData.role, email: user.email }
  const { data: participant } = await supabaseAdmin.from('participants').select('id').eq('email', user.email).single()
  if (participant) return { role: 'participant', email: user.email, id: participant.id }
  return null
}

export async function GET(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId!)
    .eq('is_read', false)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const userId = searchParams.get('user_id')

  let query = supabaseAdmin.from('notifications').delete()
  if (id) query = query.eq('id', id)
  if (userId) query = query.eq('user_id', userId)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabaseAdmin.from('notifications').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
