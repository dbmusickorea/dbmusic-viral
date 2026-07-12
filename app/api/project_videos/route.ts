import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')

  let query = supabaseAdmin.from('project_videos').select('*')
  if (projectCode) query = query.ilike('project_code', projectCode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data?.[0] ?? null)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('project_videos').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const body = await request.json()

  const { error } = await supabaseAdmin.from('project_videos').update(body).eq('project_code', projectCode!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}