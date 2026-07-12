import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('comment_missions').select('*')
  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)
    const projectCode = searchParams.get('project_code')
  if (projectCode) query = query.eq('project_code', projectCode)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}