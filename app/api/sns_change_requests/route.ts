import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAuth.auth.getUser(token)
  if (!user) return null
  const { data: userData } = await supabaseAdmin.from('users').select('role').eq('email', user.email).single()
  if (userData) return { role: userData.role, email: user.email }
  const { data: participant } = await supabaseAdmin.from('participants').select('id').eq('email', user.email).single()
  if (participant) return { role: 'participant', email: user.email, id: participant.id }
  return null
}

export async function GET(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('sns_change_requests').select('*').order('created_at', { ascending: false })

  if (roleInfo.role === 'participant') {
    query = query.eq('member_id', roleInfo.id)
  } else {
    if (memberId) query = query.eq('member_id', memberId)
    if (status) query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabaseAdmin.from('sns_change_requests').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo || roleInfo.role === 'participant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    if (req.platform === 'instagram') {
      try {
        const igRes = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/profile?username_or_id_or_url=${req.new_id}`, {
          headers: { 'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com', 'x-rapidapi-key': process.env.RAPIDAPI_KEY! }
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
