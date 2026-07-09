import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const projectCode = request.nextUrl.searchParams.get('project_code')
  if (!projectCode) return NextResponse.json({ error: 'project_code required' }, { status: 400 })

  // 프로젝트 정보
  const { data: project } = await supabase.from('projects').select('*').ilike('project_code', projectCode).maybeSingle()
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })

  // 게시물 목록
  const { data: posts } = await supabase.from('posts').select('*').ilike('project_code', projectCode).order('created_at', { ascending: true })

  // 일별 통계
  const { data: history } = await supabase.from('post_stats_history').select('*').ilike('project_code', projectCode).order('recorded_at', { ascending: true })

  // 댓글 미션
  const { data: commentMissions } = await supabase.from('comment_missions').select('*').ilike('project_code', projectCode).eq('status', 'APPROVED')

  const wb = XLSX.utils.book_new()

  // 시트 1: 프로젝트 요약
  const summaryData = [
    ['더블비뮤직 바이럴 결과보고서'],
    [],
    ['프로젝트 코드', project.project_code],
    ['의뢰인', project.client_name],
    ['상품명', project.product_content],
    ['요청사항', project.requirements ?? '-'],
    ['시작일', project.start_date ?? '-'],
    ['종료일', project.end_date ?? '-'],
    ['모집인원', project.max_participants ?? '-'],
    [],
    ['총 게시물 수', posts?.length ?? 0],
    ['인스타그램', posts?.filter(p => p.platform === 'instagram').length ?? 0],
    ['유튜브', posts?.filter(p => p.platform === 'youtube').length ?? 0],
    ['틱톡', posts?.filter(p => p.platform === 'tiktok').length ?? 0],
    ['총 좋아요', posts?.reduce((sum, p) => sum + (p.likes_count ?? 0), 0) ?? 0],
    ['총 댓글', posts?.reduce((sum, p) => sum + (p.comments_count ?? 0), 0) ?? 0],
    ['댓글 미션 참여', commentMissions?.length ?? 0],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, '프로젝트 요약')

  // 시트 2: 게시물 목록
  const postsData = [
    ['참여자', '플랫폼', '게시물 링크', '좋아요', '댓글', '등록일'],
    ...(posts ?? []).map(p => [
      p.influencer_name,
      p.platform,
      p.post_url,
      p.likes_count ?? 0,
      p.comments_count ?? 0,
      new Date(p.created_at).toLocaleDateString('ko-KR')
    ])
  ]
  const postsSheet = XLSX.utils.aoa_to_sheet(postsData)
  postsSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, postsSheet, '게시물 목록')

  // 시트 3: 일별 통계
  if (history && history.length > 0) {
    const dates = [...new Set(history.map(h => h.recorded_at))].sort()
    const dailyData = [
      ['날짜', '총 좋아요', '총 댓글'],
      ...dates.map(date => {
        const dayStats = history.filter(h => h.recorded_at === date)
        return [
          date,
          dayStats.reduce((sum, h) => sum + (h.likes_count ?? 0), 0),
          dayStats.reduce((sum, h) => sum + (h.comments_count ?? 0), 0)
        ]
      })
    ]
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
    dailySheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, dailySheet, '일별 통계')
  }

  // 시트 4: 댓글 미션
  if (commentMissions && commentMissions.length > 0) {
    const commentData = [
      ['참여자 핸들', '영상 ID', '적립금', '인증일'],
      ...commentMissions.map(m => [
        m.youtube_handle,
        m.video_id,
        m.reward_amount ?? 300,
        new Date(m.created_at).toLocaleDateString('ko-KR')
      ])
    ]
    const commentSheet = XLSX.utils.aoa_to_sheet(commentData)
    commentSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, commentSheet, '댓글 미션')
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${projectCode}_report.xlsx"`
    }
  })
}