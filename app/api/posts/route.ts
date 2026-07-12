import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const projectCode = searchParams.get('project_code')
  const isCover = searchParams.get('is_cover')

  let query = supabaseAdmin.from('posts').select('*').order('created_at', { ascending: false })

  if (memberId) query = query.eq('member_id', memberId)
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (isCover) query = query.eq('is_cover', isCover === 'true')

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}