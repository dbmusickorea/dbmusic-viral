import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return { client, user }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = auth.client.from('sns_change_requests').select('*').order('created_at', { ascending: false })
  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // 같은 회원+플랫폼으로 이미 대기중인 요청이 있으면 중복 생성 막기
  const { data: existing } = await auth.client
    .from('sns_change_requests')
    .select('id')
    .eq('member_id', body.member_id)
    .eq('platform', body.platform)
    .eq('status', 'PENDING')
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: '이미 검토 대기중인 요청이 있어요.' }, { status: 409 })
  }

  const { error } = await auth.client.from('sns_change_requests').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()

  const { data: req } = await supabaseAdmin.from('sns_change_requests').select('*').eq('id', id).maybeSingle()

  if (body.status === 'APPROVED' && req) {
    const updateField: any = {}
    if (req.platform === 'instagram') updateField.instagram_id = req.new_id
    else if (req.platform === 'youtube') updateField.youtube_id = req.new_id
    else if (req.platform === 'tiktok') updateField.tiktok_id = req.new_id
    const { error: idUpdateError } = await supabaseAdmin.from('participants').update(updateField).eq('id', req.member_id)
    if (idUpdateError) {
      console.error('SNS 변경 승인 - 아이디 반영 실패:', idUpdateError, 'member_id:', req.member_id, 'field:', updateField)
    }

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
    } else if (req.platform === 'tiktok') {
      try {
        const ttRes = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${req.new_id.replace('@', '')}`, {
          headers: { 'x-rapidapi-key': process.env.RAPIDAPI_KEY!, 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' }
        })
        const ttData = await ttRes.json()
        console.log('SNS 변경 승인 - 틱톡 조회 응답:', ttRes.status, JSON.stringify(ttData))
        const followers = ttData?.data?.stats?.followerCount
        if (followers !== undefined && followers > 0) {
          const { error: followerUpdateError } = await supabaseAdmin.from('participants').update({
            tiktok_followers: followers,
            tiktok_profile_image: ttData.data?.user?.avatarLarger ?? undefined,
            tiktok_is_private: ttData.data?.user?.privateAccount ?? false,
          }).eq('id', req.member_id)
          if (followerUpdateError) console.error('SNS 변경 승인 - 틱톡 팔로워 DB반영 실패:', followerUpdateError)
        } else {
          console.log('SNS 변경 승인 - 틱톡 팔로워 수 못 가져옴, followers 값:', followers)
        }
      } catch (e) {
        console.error('SNS 변경 승인 - 틱톡 조회 자체 실패:', e)
      }
    }
  }

  const { error } = await auth.client.from('sns_change_requests').update(body).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
