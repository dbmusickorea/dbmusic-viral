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
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  const labelFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } }

  // 시트 1: 프로젝트 요약
  const summarySheet = workbook.addWorksheet('프로젝트 요약')
  summarySheet.columns = [{ width: 25 }, { width: 35 }]
  
  const titleRow = summarySheet.addRow(['더블비뮤직 바이럴 결과보고서'])
  titleRow.font = { bold: true, size: 16, color: { argb: 'FF1F4E79' } }
  summarySheet.addRow([])

  const infoRows = [
    ['프로젝트 코드', project.project_code],
    ['의뢰인', project.client_name],
    ['가수명', project.artist_name ?? '-'],
    ['노래제목', project.song_title ?? '-'],
    ['상품명', project.product_content],
    ['상품 금액', project.option_price ? `${Number(project.option_price).toLocaleString()}원` : '-'],
    ['모니터링 연장', project.monitoring_extension > 0 ? `${project.monitoring_extension}일` : '없음'],
    ['새로고침 주기', project.refresh_interval ? `${project.refresh_interval}시간` : '기본(하루 1회)'],
    ['커버영상 옵션', project.cover_video_count > 0 ? `${project.cover_video_count}개` : '없음'],
    ['요청사항', project.requirements ?? '-'],
    ['시작일', project.start_date ?? '-'],
    ['종료일', project.end_date ?? '-'],
    ['모집인원', project.max_participants ?? '-'],
  ]

  infoRows.forEach(([label, value]) => {
    const row = summarySheet.addRow([label, value])
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = labelFill
  })

  summarySheet.addRow([])
  
  const statsTitle = summarySheet.addRow(['📊 성과 요약'])
  statsTitle.font = { bold: true, size: 12, color: { argb: 'FF1F4E79' } }

  const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count ?? 0), 0) ?? 0
  const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count ?? 0), 0) ?? 0

  const statsRows = [
    ['총 게시물 수', posts?.length ?? 0],
    ['인스타그램', posts?.filter(p => p.platform === 'instagram').length ?? 0],
    ['유튜브', posts?.filter(p => p.platform === 'youtube').length ?? 0],
    ['틱톡', posts?.filter(p => p.platform === 'tiktok').length ?? 0],
    ['커버영상', posts?.filter(p => p.is_cover).length ?? 0],
    ['총 좋아요', totalLikes],
    ['총 댓글', totalComments],
    ['댓글 미션 참여', commentMissions?.filter(m => m.project_code !== 'UNLOCK').length ?? 0],
  ]

  statsRows.forEach(([label, value]) => {
    const row = summarySheet.addRow([label, value])
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = labelFill
    if (typeof value === 'number') {
      row.getCell(2).numFmt = '#,##0'
    }
  })

  // 시트 2: 게시물 목록
  const postsSheet = workbook.addWorksheet('게시물 목록')
  postsSheet.columns = [
    { header: '참여자', width: 15 },
    { header: '플랫폼', width: 12 },
    { header: '게시물 링크', width: 45 },
    { header: '좋아요', width: 12 },
    { header: '댓글', width: 12 },
    { header: '조회수', width: 12 },
    { header: '커버영상', width: 10 },
    { header: '등록일', width: 15 }
  ]
  const postsHeader = postsSheet.getRow(1)
  postsHeader.font = headerFont
  postsHeader.eachCell(cell => { cell.fill = headerFill; cell.alignment = { horizontal: 'center' } })

  posts?.forEach(p => {
    const row = postsSheet.addRow([
      p.influencer_name,
      p.platform,
      { text: p.post_url, hyperlink: p.post_url },
      p.likes_count ?? 0,
      p.comments_count ?? 0,
      p.views_count ?? 0,
      p.is_cover ? '✅' : '',
      new Date(p.created_at).toLocaleDateString('ko-KR')
    ])
    row.getCell(3).font = { color: { argb: 'FF0000FF' }, underline: true }
    ;[4, 5, 6].forEach(col => { row.getCell(col).numFmt = '#,##0' })
  })

  // 시트 3: 커버영상 목록
  const coverPosts = posts?.filter(p => p.is_cover) ?? []
  if (coverPosts.length > 0) {
    const coverSheet = workbook.addWorksheet('커버영상 목록')
    coverSheet.columns = [
      { header: '참여자', width: 15 },
      { header: '플랫폼', width: 12 },
      { header: '게시물 링크', width: 45 },
      { header: '좋아요', width: 12 },
      { header: '댓글', width: 12 },
      { header: '승인상태', width: 12 },
      { header: '등록일', width: 15 }
    ]
    const coverHeader = coverSheet.getRow(1)
    coverHeader.font = headerFont
    coverHeader.eachCell(cell => { cell.fill = headerFill; cell.alignment = { horizontal: 'center' } })

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
      ;[4, 5].forEach(col => { row.getCell(col).numFmt = '#,##0' })
    })
  }

  // 시트 4: 일별 통계
  if (history && history.length > 0) {
    const dailySheet = workbook.addWorksheet('일별 통계')
    dailySheet.columns = [
      { header: '날짜', width: 20 },
      { header: '총 좋아요', width: 15 },
      { header: '총 댓글', width: 15 },
      { header: '총 조회수', width: 15 }
    ]
    const dailyHeader = dailySheet.getRow(1)
    dailyHeader.font = headerFont
    dailyHeader.eachCell(cell => { cell.fill = headerFill; cell.alignment = { horizontal: 'center' } })

    // 날짜별 최신 스냅샷만
    const dates = [...new Set(history.map(h => h.recorded_at.split('_')[0]))].sort()
    dates.forEach(date => {
      const dayData = history.filter(h => h.recorded_at.startsWith(date))
      const getLatest = (data: any[]) => {
        const map = new Map()
        data.forEach(h => {
          const key = h.post_id ?? h.link_id
          const hour = parseInt(h.recorded_at.split('_')[1] ?? '0')
          const existing = map.get(key)
          const existingHour = existing ? parseInt(existing.recorded_at.split('_')[1] ?? '0') : -1
          if (!existing || hour > existingHour) map.set(key, h)
        })
        return Array.from(map.values())
      }
      const latest = getLatest(dayData)
      const row = dailySheet.addRow([
        date,
        latest.reduce((sum, h) => sum + (h.likes_count ?? 0), 0),
        latest.reduce((sum, h) => sum + (h.comments_count ?? 0), 0),
        latest.reduce((sum, h) => sum + (h.views_count ?? 0), 0),
      ])
      ;[2, 3, 4].forEach(col => { row.getCell(col).numFmt = '#,##0' })
    })
  }

  // 시트 5: 댓글 미션
  if (commentMissions && commentMissions.length > 0) {
    const commentSheet = workbook.addWorksheet('댓글 미션')
    commentSheet.columns = [
      { header: '참여자 핸들', width: 25 },
      { header: '영상 ID', width: 20 },      
      { header: '인증일', width: 15 }
    ]
    const commentHeader = commentSheet.getRow(1)
    commentHeader.font = headerFont
    commentHeader.eachCell(cell => { cell.fill = headerFill; cell.alignment = { horizontal: 'center' } })

    commentMissions.filter(m => m.project_code !== 'UNLOCK').forEach(m => {
      commentSheet.addRow([
        m.youtube_handle,
        m.video_id,        
        new Date(m.created_at).toLocaleDateString('ko-KR')
      ])
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fileName = encodeURIComponent(`더블비뮤직_${project.artist_name ?? project.client_name}_${project.song_title ?? project.product_content}_보고서.xlsx`)

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`
    }
  })
}
