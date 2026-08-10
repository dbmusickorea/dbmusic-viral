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

  if (email) {
    const { data } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
    return NextResponse.json({ exists: !!data })
  }

  if (mobile) {
    const { data } = await supabaseAdmin.from('users').select('id').eq('mobile', mobile).single()
    return NextResponse.json({ exists: !!data })
  }

  const clientId = searchParams.get('client_id')
  if (clientId) {
    const { data } = await supabaseAdmin.from('users').select('id').eq('client_id', clientId).single()
    return NextResponse.json({ exists: !!data })
  }

  return NextResponse.json({ error: 'invalid params' }, { status: 400 })
}
