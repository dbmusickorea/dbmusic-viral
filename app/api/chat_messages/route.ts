import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const role = searchParams.get('role')
  if (!userId || !role) return NextResponse.json({ error: 'user_id, role 필요' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, role, sender, body: messageBody, project_code } = body
  if (!user_id || !role || !sender || !messageBody) {
    return NextResponse.json({ error: 'user_id, role, sender, body 필요' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({ user_id, role, sender, body: messageBody, project_code: project_code ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { user_id, role, reader } = body
  if (!user_id || !role || !reader) return NextResponse.json({ error: 'user_id, role, reader 필요' }, { status: 400 })

  const otherSender = reader === 'admin' ? 'user' : 'admin'

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .eq('role', role)
    .eq('sender', otherSender)
    .is('read_at', null)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
