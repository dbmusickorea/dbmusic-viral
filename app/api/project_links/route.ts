import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const projectCode = request.nextUrl.searchParams.get('project_code')
  let query = supabaseAdmin.from('project_links').select('*').order('created_at', { ascending: true })
  if (projectCode) query = query.ilike('project_code', projectCode)
  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabaseAdmin.from('project_links').insert(body).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const body = await request.json()
  const { error } = await supabaseAdmin.from('project_links').update(body).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const { error } = await supabaseAdmin.from('project_links').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}