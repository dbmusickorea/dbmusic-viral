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
  const projectCode = searchParams.get('project_code')
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('project_participants').select('*, projects(status, start_date, required_posts, artist_name, song_title, client_name, second_post_date, second_post_time)').order('joined_at', { ascending: false })

  // 체험단은 본인 것만
  if (roleInfo.role === 'participant') {
    query = query.eq('member_id', roleInfo.id)
  } else {
    if (projectCode) query = query.ilike('project_code', projectCode)
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
  const { error } = await supabaseAdmin.from('project_participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })

  if (body.is_cover) {
    const { data: project } = await supabaseAdmin.from('projects').select('cover_current').ilike('project_code', body.project_code).maybeSingle()
    await supabaseAdmin.from('projects').update({ cover_current: (project?.cover_current ?? 0) + 1 }).ilike('project_code', body.project_code)
  } else {
    const { data: project } = await supabaseAdmin.from('projects').select('current_participants').ilike('project_code', body.project_code).maybeSingle()
    await supabaseAdmin.from('projects').update({ current_participants: (project?.current_participants ?? 0) + 1 }).ilike('project_code', body.project_code)
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const memberId = searchParams.get('member_id')
  const body = await request.json()

  let query = supabaseAdmin.from('project_participants').update(body)
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (memberId) query = query.eq('member_id', memberId)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo || roleInfo.role === 'participant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: participation } = await supabaseAdmin.from('project_participants').select('project_code, member_id, is_cover').eq('id', Number(id)).maybeSingle()
  if (!participation) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { project_code, member_id } = participation

  const { count: postCount } = await supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).ilike('project_code', project_code).eq('member_id', member_id)
  const { data: project } = await supabaseAdmin.from('projects').select('reward_per_post, current_participants, cover_current').ilike('project_code', project_code).maybeSingle()

  const deductAmount = (postCount ?? 0) * (project?.reward_per_post ?? 0)

  if (deductAmount > 0) {
    const { data: participant } = await supabaseAdmin.from('participants').select('balance').eq('id', member_id).maybeSingle()
    const newBalance = Math.max(0, (participant?.balance ?? 0) - deductAmount)
    await supabaseAdmin.from('participants').update({ balance: newBalance }).eq('id', member_id)
  }

  await supabaseAdmin.from('posts').delete().ilike('project_code', project_code).eq('member_id', member_id)
  await supabaseAdmin.from('comment_missions').delete().ilike('project_code', project_code).eq('member_id', member_id)

  if (participation?.is_cover) {
    if (project && (project.cover_current ?? 0) > 0) {
      await supabaseAdmin.from('projects').update({ cover_current: (project.cover_current ?? 1) - 1 }).ilike('project_code', project_code)
    }
  } else {
    if (project && project.current_participants > 0) {
      await supabaseAdmin.from('projects').update({ current_participants: project.current_participants - 1 }).ilike('project_code', project_code)
    }
  }

  const { error } = await supabaseAdmin.from('project_participants').update({ status: 'CANCELLED' }).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true, deducted: deductAmount, postsDeleted: postCount ?? 0 })
}
