'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import DistributionFooter from '../../components/DistributionFooter'
import { useToast } from '../../components/ToastContext'
import { ArrowLeft, Trophy, Lock } from 'lucide-react'

function CoverContestPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectCode = searchParams.get('project_code')
  const { showToast } = useToast()

  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [project, setProject] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    document.title = '커버 컨테스트'
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info || !role) { router.push('/'); return }
    setUserInfo(JSON.parse(info))
    setUserRole(role)
  }, [])

  useEffect(() => {
    if (!userRole) return
    if (!projectCode) { setLoading(false); return }
    fetchData()
  }, [userRole, projectCode])

  const fetchData = async () => {
    setLoading(true)
    const projectRes = await fetchWithAuth(`/api/projects?project_code=${projectCode}`)
    const projectList = await projectRes.json()
    const projectData = Array.isArray(projectList) ? projectList[0] : projectList
    setProject(projectData)

    const postsRes = await fetchWithAuth(`/api/posts?is_cover=true&project_code=${projectCode}`)
    const posts = await postsRes.json()

    if (!Array.isArray(posts) || posts.length === 0) { setRows([]); setLoading(false); return }

    const memberIds = [...new Set(posts.map((p: any) => p.member_id))]
    const membersRes = await fetchWithAuth(`/api/participants?ids=${memberIds.join(',')}`)
    const members = await membersRes.json()
    const memberMap = new Map((Array.isArray(members) ? members : []).map((m: any) => [m.id, m]))

    // 좋아요순 정렬 + 동순위 처리 + 순위점수 산정 (체험단 채널)
    const rankBy = (list: any[], field: string, rankKey: string, scoreKey: string) => {
      const sorted = [...list].sort((a: any, b: any) => (b[field] ?? 0) - (a[field] ?? 0))
      let rank = 0
      let prev: number | null = null
      const map = new Map<number, { rank: number; score: number }>()
      sorted.forEach((p: any, idx: number) => {
        if (prev === null || (p[field] ?? 0) !== prev) {
          rank = idx + 1
          prev = p[field] ?? 0
        }
        map.set(p.id, { rank, score: Math.max(11 - rank, 0) })
      })
      return map
    }

    const likeRankMap = rankBy(posts, 'likes_count', 'likeRank', 'rankScore')
    const adminRankMap = rankBy(posts, 'admin_channel_likes', 'adminLikeRank', 'adminRankScore')

    const withRankScore = posts.map((p: any) => {
      const likeInfo = likeRankMap.get(p.id) ?? { rank: 0, score: 0 }
      const adminInfo = adminRankMap.get(p.id) ?? { rank: 0, score: 0 }
      return {
        ...p,
        likeRank: likeInfo.rank, rankScore: likeInfo.score,
        adminLikeRank: adminInfo.rank, adminRankScore: adminInfo.score,
        member: memberMap.get(p.member_id)
      }
    })

    setRows(withRankScore)
    setLoading(false)
  }

  // 최종점수 계산 + 동점 처리된 최종순위
  const computeFinalRanking = (list: any[]) => {
    const withFinal = list.map(r => ({ ...r, finalScore: r.rankScore + r.adminRankScore + (r.contest_score ?? 0) }))
    const sorted = [...withFinal].sort((a, b) => b.finalScore - a.finalScore)
    let rank = 0
    let prevScore: number | null = null
    return sorted.map((r, idx) => {
      if (prevScore === null || r.finalScore !== prevScore) {
        rank = idx + 1
        prevScore = r.finalScore
      }
      return { ...r, finalRank: rank }
    })
  }

  const finalRows = computeFinalRanking(rows)

  const handleScoreChange = async (postId: number, value: string) => {
    const num = value === '' ? null : Math.max(0, Math.min(100, Number(value)))
    setRows(prev => prev.map(r => r.id === postId ? { ...r, contest_score: num } : r))
  }

  const handleScoreSave = async (postId: number, value: number | null) => {
    setSaving(postId)
    await fetchWithAuth(`/api/posts?id=${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contest_score: value })
    })
    setSaving(null)
    showToast('점수가 저장됐어요.')
  }

  const handleAdminUrlChange = (postId: number, value: string) => {
    setRows(prev => prev.map(r => r.id === postId ? { ...r, admin_channel_url: value } : r))
  }

  const handleAdminUrlSave = async (postId: number, value: string) => {
    setSaving(postId)
    await fetchWithAuth(`/api/posts?id=${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_channel_url: value || null })
    })
    setSaving(null)
    showToast('더블비뮤직 채널 링크가 저장됐어요. 다음 좋아요 집계 때 반영돼요.')
  }

  const handleClose = async () => {
    const ok = window.confirm('컨테스트를 마감하면 더 이상 점수를 수정할 수 없어요. 마감하시겠어요?')
    if (!ok) return
    setClosing(true)
    await fetchWithAuth(`/api/projects?project_code=${projectCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_contest_closed: true })
    })
    setClosing(false)
    showToast('컨테스트가 마감됐어요.')
    fetchData()
  }

  const closed = !!project?.cover_contest_closed
  const canEditScore = userRole === 'client' && !closed
  const isAdmin = userRole === 'admin'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-2">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 dark:invert" />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.back()} className="text-gray-500 dark:text-gray-300"><ArrowLeft size={20} /></button>
          <h1 className="text-lg font-bold dark:text-white flex items-center gap-1"><Trophy size={18} className="text-yellow-500" /> 커버 컨테스트</h1>
        </div>

        {project && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.artist_name} - {project.song_title}</p>
        )}

        {closed && (
          <div className="bg-orange-50 dark:bg-gray-700 border-l-4 border-orange-400 rounded-lg p-3 mb-4 flex items-center gap-1.5 text-sm text-orange-700 dark:text-orange-200">
            <Lock size={14} /> 컨테스트가 마감됐어요. 최종 결과입니다.
          </div>
        )}

        {isAdmin && !closed && (
          <button onClick={handleClose} disabled={closing} className="w-full bg-red-600 text-white rounded-lg py-2.5 font-medium mb-4 disabled:bg-gray-400">
            {closing ? '마감 처리 중...' : '컨테스트 마감하기'}
          </button>
        )}

        {!projectCode ? (
          <p className="text-center text-gray-400 py-10">프로젝트 정보가 없어요.</p>
        ) : loading ? (
          <p className="text-center text-gray-400 py-10">불러오는 중...</p>
        ) : !isAdmin && project && !project.cover_contest_enabled ? (
          <p className="text-center text-gray-400 py-10">이 프로젝트는 컨테스트가 진행되지 않아요.</p>
        ) : finalRows.length === 0 ? (
          <p className="text-center text-gray-400 py-10">등록된 커버 게시물이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {finalRows.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold w-8 text-center ${r.finalRank === 1 ? 'text-yellow-500' : 'text-gray-400'}`}>{r.finalRank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white">{r.member?.name ?? '알 수 없음'}</p>
                      <a href={r.post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 break-all">{r.post_url}</a>
                      {isAdmin ? (
                        <input
                          type="text" placeholder="더블비뮤직 채널 링크 입력 (유튜브/인스타/틱톡)"
                          defaultValue={r.admin_channel_url ?? ''}
                          onBlur={(e) => { if (e.target.value !== (r.admin_channel_url ?? '')) { handleAdminUrlChange(r.id, e.target.value); handleAdminUrlSave(r.id, e.target.value) } }}
                          disabled={saving === r.id}
                          className="text-xs w-full mt-1 border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                        />
                      ) : r.admin_channel_url ? (
                        <a href={r.admin_channel_url} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-600 break-all block mt-0.5">🎵 더블비뮤직 채널: {r.admin_channel_url}</a>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-blue-600 shrink-0">{r.finalScore}점</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                  <div>
                    <p className="text-[10px] text-gray-400">체험단 좋아요</p>
                    <p className="text-sm font-medium dark:text-white">{r.likes_count?.toLocaleString() ?? 0}</p>
                    <p className="text-[10px] text-gray-400">({r.likeRank}위 · {r.rankScore}점)</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">더블비뮤직 좋아요</p>
                    <p className="text-sm font-medium dark:text-white">{r.admin_channel_url ? (r.admin_channel_likes?.toLocaleString() ?? 0) : '-'}</p>
                    <p className="text-[10px] text-gray-400">{r.admin_channel_url ? `(${r.adminLikeRank}위 · ${r.adminRankScore}점)` : ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">의뢰인 점수</p>
                    {canEditScore ? (
                      <input
                        type="number" min={0} max={100}
                        value={r.contest_score ?? ''}
                        onChange={(e) => handleScoreChange(r.id, e.target.value)}
                        onBlur={(e) => handleScoreSave(r.id, e.target.value === '' ? null : Number(e.target.value))}
                        disabled={saving === r.id}
                        className="w-16 mx-auto text-center border dark:border-gray-600 rounded-lg py-1 text-sm dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-medium dark:text-white">{r.contest_score ?? '-'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">최종 순위</p>
                    <p className="text-sm font-bold dark:text-white">{r.finalRank}등</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DistributionFooter />
      </div>
    </div>
  )
}

export default function CoverContestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-gray-900" />}>
      <CoverContestPageInner />
    </Suspense>
  )
}
