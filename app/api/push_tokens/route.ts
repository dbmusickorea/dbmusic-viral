import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userRole = searchParams.get('user_role')
  const userId = searchParams.get('user_id')
  const userIds = searchParams.get('user_ids')

  let query = supabaseAdmin.from('push_tokens').select('token, user_id, user_role')

  if (userRole) query = query.eq('user_role', userRole)
  if (userId) query = query.eq('user_id', userId)
  if (userIds) query = query.in('user_id', userIds.split(','))

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}