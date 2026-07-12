import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')
  const projectCode = searchParams.get('project_code')
  const codes = searchParams.get('codes')

  let query = supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (status) query = query.eq('status', status)
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (codes) query = query.in('project_code', codes.split(','))

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}