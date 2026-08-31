import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getLevelAmount(level: number) {
  return level === 50 ? 10000 : Math.min(2500 + (level - 1) * 150, 10000)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const id = searchParams.get('id')

  if (!role) return NextResponse.json({ error: 'role 필요' }, { status: 400 })

  if (role === 'participant') {
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const [participantRes, activeParticipationsRes, pointHistoryRes, settlementsRes, allParticipationsRes] = await Promise.all([
      supabaseAdmin.from('participants').select('*').eq('id', id).maybeSingle(),
      supabaseAdmin.from('project_participants').select('*, projects(artist_name, client_name, song_title, status, end_date)').eq('member_id', id).eq('status', 'ACTIVE'),
      supabaseAdmin.from('point_history').select('*').eq('member_id', id),
      supabaseAdmin.from('settlements').select('*').eq('member_id', id).in('status', ['PENDING', 'APPROVED']),
      supabaseAdmin.from('project_participants').select('project_code').eq('member_id', id)
    ])

    const participant = participantRes.data
    const activeProjects = (activeParticipationsRes.data ?? [])
      .map((pp: any) => pp.projects)
      .filter(Boolean)
      .filter((p: any) => p.status === 'ONGOING' || p.status === 'PENDING')
      .map((p: any) => ({ name: `${p.artist_name || p.client_name} - ${p.song_title ?? ''}`, status: p.status }))

    const codes = [...new Set((allParticipationsRes.data ?? []).map((p: any) => p.project_code))]
    const { data: myProjects } = codes.length > 0
      ? await supabaseAdmin.from('projects').select('project_code, status, end_date').in('project_code', codes)
      : { data: [] }
    const completedProjects = (myProjects ?? []).filter((p: any) => p.status === 'COMPLETED')

    const isCoverMemo = (memo: string) => (memo ?? '').includes('커버')
    const settledAmount = (settlementsRes.data ?? []).reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0)
    const availableAmount = (pointHistoryRes.data ?? []).reduce((sum: number, ph: any) => {
      if (!ph.project_code) return sum + (ph.amount ?? 0)
      const project = completedProjects.find((p: any) => p.project_code.toLowerCase() === ph.project_code.toLowerCase())
      if (!project) return sum
      if (isCoverMemo(ph.memo)) {
        const endDate = project.end_date ? new Date(project.end_date) : null
        if (!endDate) return sum
        const coverDeadline = new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        if (new Date() < coverDeadline) return sum
      }
      return sum + (ph.amount ?? 0)
    }, 0)
    const withdrawableBalance = Math.max(0, availableAmount - settledAmount)

    return NextResponse.json({
      name: participant?.name ?? '',
      level: participant?.level ?? 1,
      levelAmount: getLevelAmount(participant?.level ?? 1),
      balance: participant?.balance ?? 0,
      withdrawableBalance,
      minWithdrawAmount: 10000,
      activeProjects
    })
  }

  if (role === 'client') {
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const { data: user } = await supabaseAdmin.from('users').select('client_id, name').eq('id', id).maybeSingle()
    const clientId = user?.client_id
    const { data: projects } = clientId
      ? await supabaseAdmin.from('projects').select('*').eq('client_id', clientId).eq('status', 'ONGOING')
      : { data: [] }

    const projectCodes = (projects ?? []).map((p: any) => p.project_code)
    const { data: posts } = projectCodes.length > 0
      ? await supabaseAdmin.from('posts').select('project_code, platform, likes_count, comments_count, views_count').in('project_code', projectCodes)
      : { data: [] }

    const sumBy = (list: any[], key: string) => list.reduce((s: number, post: any) => s + (post[key] ?? 0), 0)
    const platformStat = (list: any[], platform: string) => {
      const filtered = list.filter((post: any) => post.platform === platform)
      return { platform, views: sumBy(filtered, 'views_count'), likes: sumBy(filtered, 'likes_count'), comments: sumBy(filtered, 'comments_count') }
    }

    const projectSummaries = (projects ?? []).map((p: any) => {
      const relatedPosts = (posts ?? []).filter((post: any) => post.project_code?.toLowerCase() === p.project_code?.toLowerCase())
      return {
        name: `${p.artist_name || p.client_name} - ${p.song_title ?? p.product_content}`,
        likes: sumBy(relatedPosts, 'likes_count'),
        comments: sumBy(relatedPosts, 'comments_count'),
        views: sumBy(relatedPosts, 'views_count'),
        platformStats: [
          platformStat(relatedPosts, 'instagram'),
          platformStat(relatedPosts, 'youtube'),
          platformStat(relatedPosts, 'tiktok')
        ]
      }
    })

    return NextResponse.json({
      name: user?.name ?? '',
      ongoingCount: projects?.length ?? 0,
      projects: projectSummaries
    })
  }

  if (role === 'admin') {
    // 한국시간(KST, UTC+9) 기준 오늘 00:00:00부터
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const todayStartKST = new Date(Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), nowKST.getUTCDate()) - 9 * 60 * 60 * 1000)
    const oneDayAgo = todayStartKST.toISOString()

    const [newParticipantsRes, newClientsRes, coverPendingRes, snsPendingRes, settlementPendingRes, chatUnreadRes, ongoingProjectsRes] = await Promise.all([
      supabaseAdmin.from('participants').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
      supabaseAdmin.from('participants').select('id', { count: 'exact', head: true }).eq('is_cover_possible', true).eq('cover_approved', false),
      supabaseAdmin.from('sns_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabaseAdmin.from('settlements').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabaseAdmin.from('chat_messages').select('id', { count: 'exact', head: true }).eq('sender', 'user').is('read_at', null),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'ONGOING')
    ])

    return NextResponse.json({
      newSignups: (newParticipantsRes.count ?? 0) + (newClientsRes.count ?? 0),
      coverPending: coverPendingRes.count ?? 0,
      snsChangePending: snsPendingRes.count ?? 0,
      settlementPending: settlementPendingRes.count ?? 0,
      chatUnread: chatUnreadRes.count ?? 0,
      ongoingProjectCount: ongoingProjectsRes.count ?? 0
    })
  }

  return NextResponse.json({ error: 'role은 participant, client, admin 중 하나여야 해요' }, { status: 400 })
}
