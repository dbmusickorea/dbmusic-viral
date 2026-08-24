import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, Math.min(3, local.length))
  const masked = '*'.repeat(Math.max(local.length - visible.length, 2))
  return `${visible}${masked}@${domain}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mobile = searchParams.get('mobile')

  if (!mobile) return NextResponse.json({ error: 'mobile 필요' }, { status: 400 })

  const [participantRes, userRes] = await Promise.all([
    supabaseAdmin.from('participants').select('email').eq('mobile', mobile).eq('is_deleted', false),
    supabaseAdmin.from('users').select('email').eq('mobile', mobile).eq('is_deleted', false)
  ])

  const emails = [
    ...(participantRes.data ?? []).map((p: any) => p.email),
    ...(userRes.data ?? []).map((u: any) => u.email)
  ].filter(Boolean)

  const uniqueMasked = [...new Set(emails)].map(maskEmail)

  return NextResponse.json({ emails: uniqueMasked })
}
