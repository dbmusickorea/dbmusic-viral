import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
// @ts-ignore
import XlsxPopulate from 'xlsx-populate'

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

  const templatePath = path.join(process.cwd(), 'public', 'report-template.xlsx')
  const workbook = await XlsxPopulate.fromFileAsync(templatePath)

  const summarySheet = workbook.sheet('프로젝트 요약')
  const infoRows = [
    ['프로젝트 코드', project.project_code],
    ['의뢰인', project.client_name],
    ['가수명', project.artist_name ?? '-'],
    ['노래제목', project.song_title ?? '-'],
    ['상품명', project.product_content],
    ['상품 금액', project.total_cost ? `${Number(project.total_cost).toLocaleString()}원` : '-'],
    ['모니터링 연장', project.monitoring_extension > 0 ? `${project.monitoring_extension}일` : '없음'],
    ['새로고침 주기', project.refresh_interval ? `${project.refresh_interval}시간` : '기본(하루 1회)'],
    ['커버영상 옵션', project.cover_video_count > 0 ? `${project.cover_video_count}개` : '없음'],
    ['요청사항', project.requirements ?? '-'],
    ['시작일', project.start_date ?? '-'],
    ['종료일', project.end_date ?? '-'],
    ['모집인원', project.max_participants ?? '-'],
  ]
  infoRows.forEach(([label, value], i) => {
    summarySheet.cell(`A${i + 3}`).value(label)
    summarySheet.cell(`B${i + 3}`).value(value)
  })

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
  const statsStartRow = infoRows.length + 5
  statsRows.forEach(([label, value], i) => {
    summarySheet.cell(`A${statsStartRow + i}`).value(label)
    summarySheet.cell(`B${statsStartRow + i}`).value(value)
  })

  const postsSheet = workbook.sheet('게시물 목록')
  posts?.forEach((p, i) => {
    const row = i + 2
    postsSheet.cell(`A${row}`).value(p.influencer_name)
    postsSheet.cell(`B${row}`).value(p.platform)
    postsSheet.cell(`C${row}`).value(p.post_url)
    postsSheet.cell(`D${row}`).value(p.likes_count ?? 0)
    postsSheet.cell(`E${row}`).value(p.comments_count ?? 0)
    postsSheet.cell(`F${row}`).value(p.views_count ?? 0)
    postsSheet.cell(`G${row}`).value(p.is_cover ? '✅' : '')
    postsSheet.cell(`H${row}`).value(new Date(p.created_at).toLocaleDateString('ko-KR'))
  })

  const coverPosts = posts?.filter(p => p.is_cover) ?? []
  if (coverPosts.length > 0) {
    const coverSheet = workbook.sheet('커버영상 목록')
    if (coverSheet) {
      coverPosts.forEach((p, i) => {
        const row = i + 2
        coverSheet.cell(`A${row}`).value(p.influencer_name)
        coverSheet.cell(`B${row}`).value(p.platform)
        coverSheet.cell(`C${row}`).value(p.post_url)
        coverSheet.cell(`D${row}`).value(p.likes_count ?? 0)
        coverSheet.cell(`E${row}`).value(p.comments_count ?? 0)
        coverSheet.cell(`F${row}`).value(p.cover_status === 'APPROVED' ? '승인' : p.cover_status === 'REJECTED' ? '거절' : '대기')
        coverSheet.cell(`G${row}`).value(new Date(p.created_at).toLocaleDateString('ko-KR'))
      })
    }
  }

  if (history && history.length > 0) {
    const dailySheet = workbook.sheet('일별 통계')
    const dates = [...new Set(history.map(h => h.recorded_at.split('_')[0]))].sort()
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
    const platformMap: any = {}
    posts?.forEach(p => { platformMap[p.id] = p.platform })
    const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N']
    const platforms = [
      { key: 'instagram', colOffset: 0 },
      { key: 'youtube', colOffset: 5 },
      { key: 'tiktok', colOffset: 10 },
    ]
    dates.forEach((date, rowIdx) => {
      const dayData = history.filter(h => h.recorded_at.startsWith(date))
      const latest = getLatest(dayData)
      const dataRow = rowIdx + 3
      platforms.forEach(({ key, colOffset }) => {
        const platformData = latest.filter(h => {
          const platform = platformMap[h.post_id] ?? h.platform
          return platform === key || (key === 'youtube' && ['youtube', 'youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(platform))
        })
        dailySheet.cell(`${colLetters[colOffset]}${dataRow}`).value(date).style({ border: true })
        dailySheet.cell(`${colLetters[colOffset+1]}${dataRow}`).value(platformData.reduce((s, h) => s + (h.likes_count ?? 0), 0)).style({ border: true, numberFormat: '#,##0' })
        dailySheet.cell(`${colLetters[colOffset+2]}${dataRow}`).value(platformData.reduce((s, h) => s + (h.comments_count ?? 0), 0)).style({ border: true, numberFormat: '#,##0' })
        dailySheet.cell(`${colLetters[colOffset+3]}${dataRow}`).value(platformData.reduce((s, h) => s + (h.views_count ?? 0), 0)).style({ border: true, numberFormat: '#,##0' })
      })
    })
  }

  if (commentMissions && commentMissions.length > 0) {
    const commentSheet = workbook.sheet('댓글 미션')
    if (commentSheet) {
      commentMissions.filter(m => m.project_code !== 'UNLOCK').forEach((m, i) => {
        const row = i + 2
        commentSheet.cell(`A${row}`).value(m.youtube_handle)
        commentSheet.cell(`B${row}`).value(m.video_id)
        commentSheet.cell(`C${row}`).value(new Date(m.created_at).toLocaleDateString('ko-KR'))
      })
    }
  }

  const buffer = await workbook.outputAsync()
  const fileName = encodeURIComponent(`더블비뮤직_${project.artist_name ?? project.client_name}_${project.song_title ?? project.product_content}_보고서.xlsx`)

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`
    }
  })
}
