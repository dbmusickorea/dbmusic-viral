import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const [
    participantRes,
    postsRes,
    settlementsRes,
    commentMissionsRes,
    allProjectsRes,
    unlockVideosRes,
    participationsRes,
    notificationsRes
  ] = await Promise.all([
    supabaseAdmin.from('participants').select('*').eq('id', id).maybeSingle(),
    supabaseAdmin.from('posts').select('*').eq('member_id', id).order('created_at', { ascending: false }),
    supabaseAdmin.from('settlements').select('*').eq('member_id', id).order('requested_at', { ascending: false }),
    supabaseAdmin.from('comment_missions').select('*').eq('member_id', id),
    supabaseAdmin.from('projects').select('*').in('status', ['ONGOING', 'PAUSED']).order('created_at', { ascending: false }),
    supabaseAdmin.from('unlock_videos').select('*'),
    supabaseAdmin.from('project_participants').select('*').eq('member_id', id).order('joined_at', { ascending: false }),
    supabaseAdmin.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false })
  ])

  // 참여 프로젝트 조회
  const participationCodes = participationsRes.data?.map((p: any) => p.project_code) ?? []
  const myProjectsRes = participationCodes.length > 0
    ? await supabaseAdmin.from('projects').select('*').in('project_code', participationCodes)
    : { data: [] }

  return NextResponse.json({
    participant: participantRes.data,
    posts: postsRes.data ?? [],
    settlements: settlementsRes.data ?? [],
    commentMissions: commentMissionsRes.data ?? [],
    allProjects: allProjectsRes.data ?? [],
    unlockVideos: unlockVideosRes.data ?? [],
    participations: participationsRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    myProjects: myProjectsRes.data ?? []
  })
}