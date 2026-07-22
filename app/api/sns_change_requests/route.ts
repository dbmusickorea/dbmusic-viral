import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('sns_change_requests').select('*').order('created_at', { ascending: false })
  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabaseAdmin.from('sns_change_requests').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()

  const { data: req } = await supabaseAdmin.from('sns_change_requests').select('*').eq('id', id).maybeSingle()
  
  if (body.status === 'APPROVED' && req) {
    const updateField: any = {}
    if (req.platform === 'instagram') updateField.instagram_id = req.new_id
    else if (req.platform === 'youtube') updateField.youtube_id = req.new_id
    else if (req.platform === 'tiktok') updateField.tiktok_id = req.new_id
    await supabaseAdmin.from('participants').update(updateField).eq('id', req.member_id)
  }

  const { error } = await supabaseAdmin.from('sns_change_requests').update(body).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
