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
  const projectCode = searchParams.get('project_code')
  const isCover = searchParams.get('is_cover')
  const coverStatus = searchParams.get('cover_status')
  const postUrl = searchParams.get('post_url')

  let query = supabaseAdmin.from('posts').select('*').order('created_at', { ascending: false })

  // 체험단은 본인 게시물만
  if (roleInfo.role === 'participant') {
    query = query.eq('member_id', roleInfo.id)
  } else {
    if (memberId) query = query.eq('member_id', memberId)
    if (projectCode) query = query.ilike('project_code', projectCode)
    if (isCover) query = query.eq('is_cover', isCover === 'true')
    if (coverStatus) query = query.eq('cover_status', coverStatus)
    if (postUrl) query = query.ilike('post_url', `${postUrl}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabaseAdmin.from('posts').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const memberId = searchParams.get('member_id')

  // 체험단은 본인 게시물만 삭제 가능
  if (roleInfo.role === 'participant' && memberId && Number(memberId) !== roleInfo.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin.from('posts').delete()
  if (id) query = query.eq('id', id)
  else if (memberId) query = query.eq('member_id', memberId)
  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })

  if (id) await supabaseAdmin.from('post_stats_history').delete().eq('post_id', id)

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()
  const { error } = await supabaseAdmin.from('posts').update(body).eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
