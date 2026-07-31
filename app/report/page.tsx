'use client'

import { useEffect, useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, ImageRun, WidthType, AlignmentType, BorderStyle } from 'docx'

export default function ReportPage() {
  const [project, setProject] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [commentMissions, setCommentMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const instaChartRef = useRef<HTMLDivElement>(null)
  const youtubeChartRef = useRef<HTMLDivElement>(null)
  const tiktokChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectCode = params.get('project_code')
    if (!projectCode) return
    const load = async () => {
      const [projectRes, postsRes, historyRes, cmRes] = await Promise.all([
        fetch(`/api/projects?project_code=${projectCode}`),
        fetch(`/api/posts?project_code=${projectCode}`),
        fetch(`/api/post_stats_history?project_code=${projectCode}`),
        fetch(`/api/comment_missions?project_code=${projectCode}`)
      ])
      const projectData = await projectRes.json()
      setProject(Array.isArray(projectData) ? projectData[0] : projectData)
      setPosts(await postsRes.json() ?? [])
      setHistory(await historyRes.json() ?? [])
      setCommentMissions(await cmRes.json() ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const getDailyStats = () => {
    if (!history.length) return []
    const dates = [...new Set(history.map((h: any) => h.recorded_at.split('_')[0]))].sort()
    const platformMap: any = {}
    posts.forEach((p: any) => { platformMap[p.id] = p.platform })
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
    return dates.map((date: any) => {
      const dayData = history.filter((h: any) => h.recorded_at.startsWith(date))
      const latest = getLatest(dayData)
      const filter = (key: string) => latest.filter((h: any) => {
        const platform = platformMap[h.post_id] ?? h.platform
        return platform === key || (key === 'youtube' && ['youtube', 'youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(platform))
      })
      const insta = filter('instagram')
      const youtube = filter('youtube')
      const tiktok = filter('tiktok')
      return {
        date,
        인스타_좋아요: insta.reduce((s: number, h: any) => s + (h.likes_count ?? 0), 0),
        인스타_댓글: insta.reduce((s: number, h: any) => s + (h.comments_count ?? 0), 0),
        인스타_조회수: insta.reduce((s: number, h: any) => s + (h.views_count ?? 0), 0),
        유튜브_좋아요: youtube.reduce((s: number, h: any) => s + (h.likes_count ?? 0), 0),
        유튜브_댓글: youtube.reduce((s: number, h: any) => s + (h.comments_count ?? 0), 0),
        유튜브_조회수: youtube.reduce((s: number, h: any) => s + (h.views_count ?? 0), 0),
        틱톡_좋아요: tiktok.reduce((s: number, h: any) => s + (h.likes_count ?? 0), 0),
        틱톡_댓글: tiktok.reduce((s: number, h: any) => s + (h.comments_count ?? 0), 0),
        틱톡_조회수: tiktok.reduce((s: number, h: any) => s + (h.views_count ?? 0), 0),
      }
    })
  }

  const captureChart = async (ref: React.RefObject<HTMLDivElement | null>): Promise<Uint8Array | null> => {
    if (!ref.current) return null
    const domtoimage = (await import('dom-to-image')).default
    const blob = await domtoimage.toBlob(ref.current, { bgcolor: '#ffffff' })
    const arrayBuffer = await blob.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }

  const handleDownloadWord = async () => {
    const instaImg = posts.some((p: any) => p.platform === 'instagram') ? await captureChart(instaChartRef) : null
    const youtubeImg = posts.some((p: any) => ['youtube','youtube_shorts','youtube_long'].includes(p.platform)) ? await captureChart(youtubeChartRef) : null
    const tiktokImg = posts.some((p: any) => p.platform === 'tiktok') ? await captureChart(tiktokChartRef) : null

    const totalLikes = posts.reduce((s: number, p: any) => s + (p.likes_count ?? 0), 0)
    const totalComments = posts.reduce((s: number, p: any) => s + (p.comments_count ?? 0), 0)
    const totalViews = posts.reduce((s: number, p: any) => s + (p.views_count ?? 0), 0)
    
    const PAGE_WIDTH = 9026
    const thinBorder = { style: 'single' as const, size: 4, color: 'D9E2EC' }
    const tableBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: thinBorder }
    const noBorder = { style: 'none' as const, size: 0, color: 'FFFFFF' }
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder }

    const labelCell = (text: string, width: number) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { fill: 'EAF1FB' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: '1F4E79' })] })],
    })
    const valueCell = (text: string, width: number, span = 1) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      columnSpan: span,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
    })
    const headerCell = (text: string, width: number) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { fill: '1F4E79' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 18 })] })],
    })
    const dataCell = (text: string, width: number, align: any = AlignmentType.LEFT, shade?: string) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: shade ? { fill: shade } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text, size: 17 })] })],
    })
    const statCard = (label: string, value: string, width: number) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { fill: 'EEF4FC' },
      margins: { top: 140, bottom: 140 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: label, size: 16, color: '6B7280' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold: true, size: 26, color: '1F4E79' })] }),
      ],
    })

    const optionsList = [
      project.monitoring_extension > 0 ? `모니터링 연장 ${project.monitoring_extension}일` : null,
      project.cover_video_count > 0 ? `커버영상 ${project.cover_video_count}개` : null,
      project.refresh_interval && project.refresh_interval !== '0' && project.refresh_interval !== '12' ? `트래픽 부스터 (${project.refresh_interval}시간)` : null,
      project.required_posts > 1 ? `게시물 ${project.required_posts}개` : null,
    ].filter(Boolean).join(', ') || '없음'

    const infoRows = [
      ['의뢰인', project.client_name ?? '-', '시작일', project.start_date ?? '-'],
      ['가수명', project.artist_name ?? '-', '종료일', project.end_date ?? '-'],
      ['노래제목', project.song_title ?? '-', '모집인원', `${project.max_participants ?? '-'}명`],
      ['상품명', project.product_content ?? '-', '계약금액', project.total_cost ? `${Number(project.total_cost).toLocaleString()}원` : '-'],
      ['옵션사항', optionsList, '', ''],
    ]

    const sections: any[] = [
      new Paragraph({ text: '더블비뮤직 바이럴 결과보고서', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: `${project.artist_name ?? ''} / ${project.song_title ?? ''}`, color: '6B7280' })] }),
      new Paragraph({ text: '프로젝트 정보', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }),
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [1500, 3013, 1500, 3013],
        borders: tableBorders,
        rows: [
          ...infoRows.slice(0, 4).map(([l1, v1, l2, v2]) => new TableRow({ children: [labelCell(l1, 1500), valueCell(v1, 3013), labelCell(l2, 1500), valueCell(v2, 3013)] })),
          new TableRow({ children: [labelCell('옵션사항', 1500), valueCell(optionsList, 7526, 3)] }),
          new TableRow({ children: [labelCell('요청사항', 1500), valueCell(project.requirements ?? '-', 7526, 3)] }),
        ],
      }),
      new Paragraph({ text: '성과 요약', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [3009, 3009, 3008],
        borders: noBorders,
        rows: [
          new TableRow({ children: [
            statCard('총 게시물', `${posts.length}개`, 3009),
            statCard('총 좋아요', totalLikes.toLocaleString(), 3009),
            statCard('총 댓글', totalComments.toLocaleString(), 3008),
          ]}),
          new TableRow({ children: [
            statCard('총 조회수', totalViews.toLocaleString(), 3009),
            statCard('인스타그램', `${posts.filter((p: any) => p.platform === 'instagram').length}개`, 3009),
            statCard('유튜브', `${posts.filter((p: any) => ['youtube','youtube_shorts','youtube_long'].includes(p.platform)).length}개`, 3008),
          ]}),
          new TableRow({ children: [
            statCard('틱톡', `${posts.filter((p: any) => p.platform === 'tiktok').length}개`, 3009),
            statCard('커버영상', `${posts.filter((p: any) => p.is_cover).length}개`, 3009),
            statCard('댓글미션', `${commentMissions.filter((m: any) => m.project_code !== 'UNLOCK').length}개`, 3008),
          ]}),
        ],
      }),
      new Paragraph({ text: '일별 통계', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }),
    ]

    if (instaImg) {
      sections.push(new Paragraph({ children: [new ImageRun({ data: instaImg, transformation: { width: 600, height: 200 }, type: 'png' })] }))
    }
    if (youtubeImg) {
      sections.push(new Paragraph({ children: [new ImageRun({ data: youtubeImg, transformation: { width: 600, height: 200 }, type: 'png' })] }))
    }
    if (tiktokImg) {
      sections.push(new Paragraph({ children: [new ImageRun({ data: tiktokImg, transformation: { width: 600, height: 200 }, type: 'png' })] }))
    }

    sections.push(new Paragraph({ text: '게시물 목록', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } }))
    sections.push(new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [1400, 1300, 1100, 1100, 1200, 800, 2126],
      borders: tableBorders,
      rows: [
        new TableRow({ children: [
          headerCell('참여자', 1400), headerCell('플랫폼', 1300), headerCell('좋아요', 1100),
          headerCell('댓글', 1100), headerCell('조회수', 1200), headerCell('커버', 800), headerCell('등록일', 2126),
        ]}),
        ...posts.map((p: any, i: number) => new TableRow({ children: [
          dataCell(p.influencer_name ?? '', 1400, AlignmentType.LEFT, i % 2 ? 'F7F9FC' : undefined),
          dataCell(p.platform ?? '', 1300, AlignmentType.LEFT, i % 2 ? 'F7F9FC' : undefined),
          dataCell((p.likes_count ?? 0).toLocaleString(), 1100, AlignmentType.RIGHT, i % 2 ? 'F7F9FC' : undefined),
          dataCell((p.comments_count ?? 0).toLocaleString(), 1100, AlignmentType.RIGHT, i % 2 ? 'F7F9FC' : undefined),
          dataCell((p.views_count ?? 0).toLocaleString(), 1200, AlignmentType.RIGHT, i % 2 ? 'F7F9FC' : undefined),
          dataCell(p.is_cover ? '✅' : '', 800, AlignmentType.CENTER, i % 2 ? 'F7F9FC' : undefined),
          dataCell(new Date(p.created_at).toLocaleDateString('ko-KR'), 2126, AlignmentType.LEFT, i % 2 ? 'F7F9FC' : undefined),
        ]}))
      ]
    }))

    const doc = new Document({ sections: [{ children: sections }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `더블비뮤직_${project.artist_name ?? ''}_${project.song_title ?? ''}_보고서.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="flex items-center justify-center h-screen">로딩중...</div>
  if (!project) return <div className="flex items-center justify-center h-screen">프로젝트를 찾을 수 없어요</div>

  const dailyStats = getDailyStats()
  const totalLikes = posts.reduce((s: number, p: any) => s + (p.likes_count ?? 0), 0)
  const totalComments = posts.reduce((s: number, p: any) => s + (p.comments_count ?? 0), 0)
  const totalViews = posts.reduce((s: number, p: any) => s + (p.views_count ?? 0), 0)

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden fixed top-4 right-4 z-10 flex gap-2">
        {/* PDF - 빨간색 */}
        <button onClick={() => window.print()} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
            <path d="M20 2H8L4 6v16h16V2zm-9 13H7v-2h4v2zm0-4H7V9h4v2zm6 4h-4v-2h4v2zm0-4h-4V9h4v2z"/>
          </svg>
          PDF
        </button>
        {/* 워드 - 파란색 */}
        <button onClick={handleDownloadWord} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14l-4-10h2l2 6 2-6h2l-4 10z"/>
          </svg>
          Word
        </button>
        {/* 엑셀 - 녹색 */}
        <button onClick={() => {
          const params = new URLSearchParams(window.location.search)
          const projectCode = params.get('project_code')
          window.open(`/api/report?project_code=${projectCode}`, '_blank')
        }} className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
            <path d="M21.17 3.25H13.5V1.67A.67.67 0 0 0 12.83 1H2.67A.67.67 0 0 0 2 1.67v20.66c0 .37.3.67.67.67h10.16a.67.67 0 0 0 .67-.67v-1.58h7.67c.46 0 .83-.37.83-.83V4.08c0-.46-.37-.83-.83-.83zM13.5 20.33v-1.08H21v1.08H13.5zm7.5-2.41H13.5V5.08H21v12.84zM5.5 15.17l2.17-3.33-2-3.09h1.75l1.08 1.92 1.08-1.92h1.75l-2 3.09 2.17 3.33h-1.83l-1.17-2.08-1.17 2.08H5.5z"/>
          </svg>
          Excel
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-blue-900">더블비뮤직 바이럴 결과보고서</h1>
          <p className="text-gray-500 mt-1">{project.artist_name} / {project.song_title}</p>
          <p className="text-gray-400 text-sm mt-1">{project.start_date} ~ {project.end_date}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-3 border-b pb-2">📋 프로젝트 정보</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['의뢰인', project.client_name],
              ['가수명', project.artist_name ?? '-'],
              ['노래제목', project.song_title ?? '-'],
              ['상품명', project.product_content],
              ['계약금액', project.total_cost ? `${Number(project.total_cost).toLocaleString()}원` : '-'],
              ['모집인원', `${project.max_participants ?? '-'}명`],
              ['시작일', project.start_date ?? '-'],
              ['종료일', project.end_date ?? '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="text-sm font-medium text-gray-600 w-24 shrink-0">{label}</span>
                <span className="text-sm text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          {project.requirements && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-600 mb-1">요청사항</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{project.requirements}</p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-3 border-b pb-2">📊 성과 요약</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['총 게시물', `${posts.length}개`],
              ['총 좋아요', totalLikes.toLocaleString()],
              ['총 댓글', totalComments.toLocaleString()],
              ['총 조회수', totalViews.toLocaleString()],
              ['인스타그램', `${posts.filter((p: any) => p.platform === 'instagram').length}개`],
              ['유튜브', `${posts.filter((p: any) => ['youtube','youtube_shorts','youtube_long'].includes(p.platform)).length}개`],
              ['틱톡', `${posts.filter((p: any) => p.platform === 'tiktok').length}개`],
              ['커버영상', `${posts.filter((p: any) => p.is_cover).length}개`],
              ['댓글미션', `${commentMissions.filter((m: any) => m.project_code !== 'UNLOCK').length}개`],
            ].map(([label, value]) => (
              <div key={label} className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-blue-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {dailyStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-blue-900 mb-3 border-b pb-2">📈 일별 통계</h2>
            {posts.some((p: any) => p.platform === 'instagram') && (
              <div className="mb-6" ref={instaChartRef}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">인스타그램</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="인스타_좋아요" stroke="#E1306C" name="좋아요" dot={false} />
                    <Line type="monotone" dataKey="인스타_댓글" stroke="#833AB4" name="댓글" dot={false} />
                    <Line type="monotone" dataKey="인스타_조회수" stroke="#F77737" name="조회수" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {posts.some((p: any) => ['youtube','youtube_shorts','youtube_long'].includes(p.platform)) && (
              <div className="mb-6" ref={youtubeChartRef}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">유튜브</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="유튜브_좋아요" stroke="#FF0000" name="좋아요" dot={false} />
                    <Line type="monotone" dataKey="유튜브_댓글" stroke="#FF6B6B" name="댓글" dot={false} />
                    <Line type="monotone" dataKey="유튜브_조회수" stroke="#CC0000" name="조회수" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {posts.some((p: any) => p.platform === 'tiktok') && (
              <div className="mb-6" ref={tiktokChartRef}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">틱톡</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="틱톡_좋아요" stroke="#000000" name="좋아요" dot={false} />
                    <Line type="monotone" dataKey="틱톡_댓글" stroke="#666666" name="댓글" dot={false} />
                    <Line type="monotone" dataKey="틱톡_조회수" stroke="#333333" name="조회수" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-3 border-b pb-2">📝 게시물 목록</h2>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-2 text-left border">참여자</th>
                <th className="p-2 text-left border">플랫폼</th>
                <th className="p-2 text-right border">좋아요</th>
                <th className="p-2 text-right border">댓글</th>
                <th className="p-2 text-right border">조회수</th>
                <th className="p-2 text-center border">커버</th>
                <th className="p-2 text-left border">등록일</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 border">{p.influencer_name}</td>
                  <td className="p-2 border">{p.platform}</td>
                  <td className="p-2 border text-right">{(p.likes_count ?? 0).toLocaleString()}</td>
                  <td className="p-2 border text-right">{(p.comments_count ?? 0).toLocaleString()}</td>
                  <td className="p-2 border text-right">{(p.views_count ?? 0).toLocaleString()}</td>
                  <td className="p-2 border text-center">{p.is_cover ? '✅' : ''}</td>
                  <td className="p-2 border">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-4">
          더블비뮤직 바이럴 마케팅 결과보고서 | {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none; }
        }
      `}</style>
    </div>
  )
}
