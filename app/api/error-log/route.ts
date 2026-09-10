import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { member_id, user_role, page_path, error_message, error_stack, platform, app_version, user_agent } = body

    if (!error_message) return NextResponse.json({ error: 'error_message required' }, { status: 400 })

    await supabase.from('error_logs').insert({
      member_id: member_id ? String(member_id) : null,
      user_role: user_role ?? null,
      page_path: page_path ?? null,
      error_message: String(error_message).slice(0, 2000),
      error_stack: error_stack ? String(error_stack).slice(0, 4000) : null,
      platform: platform ?? null,
      app_version: app_version ?? null,
      user_agent: user_agent ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false })
  }
}
