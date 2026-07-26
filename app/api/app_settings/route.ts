import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('app_settings').select('value').eq('key', key).maybeSingle()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? {})
}
