import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  // 인증 확인
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')

  let query = supabaseAdmin.from('post_stats_history').select('*').order('recorded_at', { ascending: true })
  if (projectCode) query = query.ilike('project_code', projectCode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}
