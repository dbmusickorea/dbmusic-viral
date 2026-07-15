import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const memberId = searchParams.get('member_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('project_participants').select('*').order('joined_at', { ascending: false })

  if (projectCode) query = query.ilike('project_code', projectCode)
  if (memberId) query = query.eq('member_id', memberId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error } = await supabaseAdmin.from('project_participants').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
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
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // 1) 참여 정보 조회
  const { data: participation } = await supabaseAdmin
    .from('project_participants')
    .select('project_code, member_id')
    .eq('id', Number(id))
    .maybeSingle()

  if (!participation) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { project_code, member_id } = participation

  // 2) 해당 프로젝트에서 제출한 게시물 수 조회
  const { count: postCount } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .ilike('project_code', project_code)
    .eq('member_id', member_id)

  // 3) reward_per_post 조회
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('reward_per_post, current_participants')
    .ilike('project_code', project_code)
    .maybeSingle()

  const deductAmount = (postCount ?? 0) * (project?.reward_per_post ?? 0)

  // 4) 포인트 회수 (balance 차감)
  if (deductAmount > 0) {
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .select('balance')
      .eq('id', member_id)
      .maybeSingle()

    const newBalance = Math.max(0, (participant?.balance ?? 0) - deductAmount)
    await supabaseAdmin
      .from('participants')
      .update({ balance: newBalance })
      .eq('id', member_id)
  }

  // 5) 해당 게시물 삭제
  await supabaseAdmin
    .from('posts')
    .delete()
    .ilike('project_code', project_code)
    .eq('member_id', member_id)

  // 6) current_participants -1
  if (project && project.current_participants > 0) {
    await supabaseAdmin
      .from('projects')
      .update({ current_participants: project.current_participants - 1 })
      .ilike('project_code', project_code)
  }

  // 7) 참여 기록 삭제
  const { error } = await supabaseAdmin
    .from('project_participants')
    .delete()
    .eq('id', Number(id))

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true, deducted: deductAmount, postsDeleted: postCount ?? 0 })
}
