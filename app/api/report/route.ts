import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const projectCode = request.nextUrl.searchParams.get('project_code')
  if (!projectCode) return NextResponse.json({ error: 'project_code required' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('*').ilike('project_code', projectCode).maybeSingle()
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })

  const { data: posts } = await supabase.from('posts').select('*').ilike('project_code', projectCode).order('created_at', { ascending: true })
  const { data: history } = await supabase.from('post_stats_history').select('*').ilike('project_code', projectCode).order('recorded_at', { ascending: true })
  const { data: commentMissions } = await supabase.from('comment_missions').select('*').ilike('project_code', projectCode).eq('status', 'APPROVED')

  const workbook = new ExcelJS.Workbook()

  // 시트 1: 프로젝트 요약
  const summarySheet = workbook.addWorksheet('프로젝트 요약')
  summarySheet.columns = [{ width: 25 }, { width: 35 }]
  summarySheet.addRow(['더블비뮤직 바이럴 결과보고서'])
  summarySheet.getRow(1).font = { bold: true, size: 14 }
  summarySheet.addRow([])
  summarySheet.addRow(['프로젝트 코드', project.project_code])
  summarySheet.addRow(['의뢰인', project.client_name])
  summarySheet.addRow(['노래제목', project.song_title ?? '-'])
  summarySheet.addRow(['상품명', project.product_content])
  summarySheet.addRow(['상품 금액', project.option_price ? `${Number(project.option_price).toLocaleString()}원` : '-'])
  summarySheet.addRow(['모니터링 연장', project.monitoring_extension > 0 ? `${project.monitoring_extension}일` : '없음'])
  summarySheet.addRow(['새로고침 주기', project.refresh_interval ? `${project.refresh_interval}시간` : '기본(하루 1회)'])
  summarySheet.addRow(['커버영상 옵션', project.cover_video_count > 0 ? `${project.cover_video_count}개` : '없음'])
  summarySheet.addRow(['요청사항', project.requirements ?? '-'])
  summarySheet.addRow(['시작일', project.start_date ?? '-'])
  summarySheet.addRow(['종료일', project.end_date ?? '-'])
  summarySheet.addRow(['모집인원', project.max_participants ?? '-'])
  summarySheet.addRow([])
  summarySheet.addRow(['총 게시물 수', posts?.length ?? 0])
  summarySheet.addRow(['인스타그램', posts?.filter(p => p.platform === 'instagram').length ?? 0])
  summarySheet.addRow(['유튜브', posts?.filter(p => p.platform === 'youtube').length ?? 0])
  summarySheet.addRow(['틱톡', posts?.filter(p => p.platform === 'tiktok').length ?? 0])
  summarySheet.addRow(['커버영상', posts?.filter(p => p.is_cover).length ?? 0])
  summarySheet.addRow(['총 좋아요', posts?.reduce((sum, p) => sum + (p.likes_count ?? 0), 0) ?? 0])
  summarySheet.addRow(['총 댓글', posts?.reduce((sum, p) => sum + (p.comments_count ?? 0), 0) ?? 0])
  summarySheet.addRow(['댓글 미션 참여', commentMissions?.filter(m => m.project_code !== 'UNLOCK').length ?? 0])

  // 시트 2: 게시물 목록
  const postsSheet = workbook.addWorksheet('게시물 목록')
  postsSheet.columns = [
    { header: '참여자', width: 15 },
    { header: '플랫폼', width: 12 },
    { header: '게시물 링크', width: 40 },
    { header: '좋아요', width: 10 },
    { header: '댓글', width: 10 },
    { header: '커버영상', width: 10 },
    { header: '등록일', width: 12 }
  ]
  postsSheet.getRow(1).font = { bold: true }
  posts?.forEach((p, i) => {
    const row = postsSheet.addRow([
      p.influencer_name,
      p.platform,
      { text: p.post_url, hyperlink: p.post_url },
      p.likes_count ?? 0,
      p.comments_count ?? 0,
      p.is_cover ? '✅' : '',
      new Date(p.created_at).toLocaleDateString('ko-KR')
    ])
    row.getCell(3).font = { color: { argb: 'FF0000FF' }, underline: true }
  })

  // 시트 3: 커버영상 목록
  const coverPosts = posts?.filter(p => p.is_cover) ?? []
  if (coverPosts.length > 0) {
    const coverSheet = workbook.addWorksheet('커버영상 목록')
    coverSheet.columns = [
      { header: '참여자', width: 15 },
      { header: '플랫폼', width: 12 },
      { header: '게시물 링크', width: 40 },
      { header: '좋아요', width: 10 },
      { header: '댓글', width: 10 },
      { header: '승인상태', width: 12 },
      { header: '등록일', width: 12 }
    ]
    coverSheet.getRow(1).font = { bold: true }
    coverPosts.forEach(p => {
      const row = coverSheet.addRow([
        p.influencer_name,
        p.platform,
        { text: p.post_url, hyperlink: p.post_url },
        p.likes_count ?? 0,
        p.comments_count ?? 0,
        p.cover_status === 'APPROVED' ? '승인' : p.cover_status === 'REJECTED' ? '거절' : '대기',
        new Date(p.created_at).toLocaleDateString('ko-KR')
      ])
      row.getCell(3).font = { color: { argb: 'FF0000FF' }, underline: true }
    })
  }

  // 시트 4: 일별 통계
  if (history && history.length > 0) {
    const dailySheet = workbook.addWorksheet('일별 통계')
    dailySheet.columns = [
      { header: '날짜', width: 15 },
      { header: '총 좋아요', width: 12 },
      { header: '총 댓글', width: 12 }
    ]
    dailySheet.getRow(1).font = { bold: true }
    const dates = [...new Set(history.map(h => h.recorded_at))].sort()
    dates.forEach(date => {
      const dayStats = history.filter(h => h.recorded_at === date)
      dailySheet.addRow([
        date,
        dayStats.reduce((sum, h) => sum + (h.likes_count ?? 0), 0),
        dayStats.reduce((sum, h) => sum + (h.comments_count ?? 0), 0)
      ])
    })
  }

  // 시트 5: 댓글 미션
  if (commentMissions && commentMissions.length > 0) {
    const commentSheet = workbook.addWorksheet('댓글 미션')
    commentSheet.columns = [
      { header: '참여자 핸들', width: 20 },
      { header: '영상 ID', width: 15 },
      { header: '적립금', width: 10 },
      { header: '인증일', width: 12 }
    ]
    commentSheet.getRow(1).font = { bold: true }
    commentMissions.filter(m => m.project_code !== 'UNLOCK').forEach(m => {
      commentSheet.addRow([
        m.youtube_handle,
        m.video_id,
        m.reward_amount ?? 300,
        new Date(m.created_at).toLocaleDateString('ko-KR')
      ])
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(`${project.client_name}_${project.song_title ?? project.product_content}`)}_report.xlsx"`
    }
  })
}