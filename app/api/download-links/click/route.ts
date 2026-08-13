import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { source_name } = await request.json()
  if (!source_name) return NextResponse.json({ error: 'source_name 없음' }, { status: 400 })

  await supabaseAdmin.rpc('increment_click_count', { src: source_name })
  return NextResponse.json({ success: true })
}
