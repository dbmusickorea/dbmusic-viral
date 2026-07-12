import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')
  let query = supabaseAdmin.from('participants').select('*').order('id', { ascending: false })
  if (ids) query = query.in('id', ids.split(',').map(Number))
  const email = searchParams.get('email')
  const referralCode = searchParams.get('referral_code')
  if (email) query = query.eq('email', email)
  if (referralCode) query = query.eq('referral_code', referralCode)
  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}