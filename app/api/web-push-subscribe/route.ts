import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, role, subscription } = body

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 })
  }

  // 같은 계정의 기존 구독은 정리하고, 이번 구독 하나만 유지 (여러 개 중복 누적 방지)
  await supabaseAdmin.from('web_push_subscriptions').delete().eq('user_id', user_id).eq('role', role)

  const { error } = await supabaseAdmin.from('web_push_subscriptions').insert({
    user_id,
    role,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('web_push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
