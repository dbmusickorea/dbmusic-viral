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
    notificationsRes,
    pointHistoryRes
  ] = await Promise.all([
    auth.client.from('participants').select('*').eq('id', id).maybeSingle(),
    auth.client.from('posts').select('*').eq('member_id', id).order('created_at', { ascending: false }),
    auth.client.from('settlements').select('*').eq('member_id', id).order('requested_at', { ascending: false }),
    auth.client.from('comment_missions').select('*').eq('member_id', id),
    auth.client.from('projects').select('*').in('status', ['ONGOING', 'PENDING']).order('created_at', { ascending: false }),
    auth.client.from('unlock_videos').select('*'),
    auth.client.from('project_participants').select('*').eq('member_id', id).order('joined_at', { ascending: false }),
    auth.client.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    auth.client.from('point_history').select('*').eq('member_id', id).order('created_at', { ascending: false })
  ])

  const participationCodes = participationsRes.data?.map((p: any) => p.project_code) ?? []
  const myProjectsRes = participationCodes.length > 0
    ? await auth.client.from('projects').select('*').in('project_code', participationCodes)
    : { data: [] }

  const rankMap: any = {}
  if (participationCodes.length > 0) {
    const allPostsRes = await supabaseAdmin
      .from('posts')
      .select('member_id, likes_count, project_code')
      .in('project_code', participationCodes)
      .not('likes_count', 'is', null)

    for (const code of participationCodes) {
      const projectPosts = allPostsRes.data
        ?.filter((p: any) => p.project_code.toLowerCase() === code.toLowerCase())
        ?.sort((a: any, b: any) => (b.likes_count ?? 0) - (a.likes_count ?? 0))

      if (!projectPosts || projectPosts.length === 0) continue
      const myPost = projectPosts.find((p: any) => p.member_id === Number(id))
      if (!myPost) continue
      const rank = projectPosts.findIndex((p: any) => p.member_id === Number(id)) + 1
      rankMap[code] = { rank, likes: myPost.likes_count, total: projectPosts.length, isEligible: myPost.likes_count >= 1000 }
    }
  }

  const allProjectCodes = allProjectsRes.data?.map((p: any) => p.project_code) ?? []
  const { data: participantCounts } = await supabaseAdmin
    .from('project_participants').select('project_code').in('project_code', allProjectCodes).eq('status', 'ACTIVE')

  const countMap: any = {}
  participantCounts?.forEach((p: any) => { countMap[p.project_code] = (countMap[p.project_code] ?? 0) + 1 })

  const completedProjects = myProjectsRes.data?.filter((p: any) => p.status === 'COMPLETED') ?? []
  const completedCodes = completedProjects.map((p: any) => p.project_code.toLowerCase())

  // 환전 가능 금액 계산: 프로젝트 무관 내역(추천인 등)은 항상 포함, 프로젝트 관련 내역은 해당 프로젝트가 종료됐을 때만 포함
  // 실제 지급/차감된 point_history 금액을 그대로 합산 (재계산하지 않음)
  const availableAmount = (pointHistoryRes.data ?? []).reduce((sum: number, ph: any) => {
    if (!ph.project_code) return sum + (ph.amount ?? 0) // 프로젝트 무관 (친구추천 등) - 항상 포함
    if (completedCodes.includes(ph.project_code.toLowerCase())) return sum + (ph.amount ?? 0) // 프로젝트 종료된 경우만 포함
    return sum
  }, 0)

  const settledAmount = (settlementsRes.data ?? [])
    .filter((s: any) => ['PENDING', 'APPROVED'].includes(s.status))
    .reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0)

  const withdrawableBalance = Math.max(0, availableAmount - settledAmount)

  // availablePosts / coverAvailablePosts는 화면 표시(게시물 목록 등)용으로 유지
  const availablePosts = postsRes.data?.filter((p: any) =>
    completedCodes.includes(p.project_code?.toLowerCase()) && !p.is_cover
  ) ?? []

  const coverAvailablePosts = postsRes.data?.filter((p: any) => {
    const project = completedProjects.find((proj: any) => proj.project_code.toLowerCase() === p.project_code?.toLowerCase())
    if (!project || !p.is_cover) return false
    const endDate = project.end_date ? new Date(project.end_date) : null
    if (!endDate) return false
    return new Date() >= new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
  }) ?? []

  return NextResponse.json({
    participant: participantRes.data,
    posts: postsRes.data ?? [],
    settlements: settlementsRes.data ?? [],
    commentMissions: commentMissionsRes.data ?? [],
    allProjects: (allProjectsRes.data ?? []).map((p: any) => ({ ...p, current_participants: countMap[p.project_code] ?? 0 })),
    unlockVideos: unlockVideosRes.data ?? [],
    participations: participationsRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    myProjects: myProjectsRes.data ?? [],
    rankMap,
    availablePosts,
    coverAvailablePosts,
    withdrawableBalance
  })
}
