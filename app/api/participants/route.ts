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
  const mobile = searchParams.get('mobile')
  if (mobile) query = query.eq('mobile', mobile)
  const referralCode = searchParams.get('referral_code')
  const coverApproved = searchParams.get('cover_approved')
  if (email) query = query.eq('email', email)
  if (referralCode) query = query.eq('referral_code', referralCode)
  if (coverApproved === 'true') query = query.eq('cover_approved', true)
  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()
  
  let query = supabaseAdmin.from('participants').update(body)
  if (id) query = query.eq('id', id)
  else if (email) query = query.eq('email', email)
  
  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabaseAdmin.from('participants').delete().eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}