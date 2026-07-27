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
    
    // 팔로워 수 업데이트
    if (req.platform === 'instagram') {
      try {
        const igRes = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/profile?username_or_id_or_url=${req.new_id}`, {
          headers: {
            'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY!
          }
        })
        const igData = await igRes.json()
        const followers = igData?.data?.follower_count
        if (followers > 0) await supabaseAdmin.from('participants').update({ instagram_followers: followers }).eq('id', req.member_id)
      } catch {}
    } else if (req.platform === 'youtube') {
      try {
        const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${req.new_id}&key=${process.env.YOUTUBE_API_KEY}`)
        const ytData = await ytRes.json()
        const subscribers = Number(ytData?.items?.[0]?.statistics?.subscriberCount ?? 0)
        if (subscribers > 0) await supabaseAdmin.from('participants').update({ youtube_subscribers: subscribers }).eq('id', req.member_id)
      } catch {}
    }
  }

  const { error } = await supabaseAdmin.from('sns_change_requests').update(body).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
