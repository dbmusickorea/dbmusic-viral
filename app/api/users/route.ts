import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'client')
    .order('name', { ascending: true })
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}