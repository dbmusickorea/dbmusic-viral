import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const mobile = searchParams.get('mobile')
  const referralCode = searchParams.get('referral_code')

  if (email) {
    const { data } = await supabaseAdmin.from('participants').select('id').eq('email', email).single()
    return NextResponse.json({ exists: !!data })
  }

  if (mobile) {
    const { data } = await supabaseAdmin.from('participants').select('id').eq('mobile', mobile).single()
    return NextResponse.json({ exists: !!data })
  }

  if (referralCode) {
    const { data } = await supabaseAdmin.from('participants').select('id, name, balance, level').eq('referral_code', referralCode).single()
    return NextResponse.json({ exists: !!data, name: data?.name, id: data?.id, balance: data?.balance, level: data?.level })
  }

  return NextResponse.json({ error: 'invalid params' }, { status: 400 })
}
