'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const getLevelAmount = (base: number, level: number) => {
  if (level === 50) return 10000
  return base + (level - 1) * 150
}

const settlementStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">검토중</span>
    case 'APPROVED': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">승인완료</span>
    case 'REJECTED': return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">반려</span>
    default: return null
  }
}

export default function WalletPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [level, setLevel] = useState(1)
  const [posts, setPosts] = useState<any[]>([])
  const [settlements, setSettlements] = useState<any[]>([])
  const [projectsMap, setProjectsMap] = useState<any>({})
  const [filter, setFilter] = useState<'all' | 'earn' | 'exchange'>('all')
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    loadData(parsed.id)
  }, [])

  const loadData = async (id: number) => {
    setLoading(true)
    const res = await fetch(`/api/participant-data?id=${id}`)
    const data = await res.json()
    const participant = data.participant

    setBalance(participant?.balance ?? 0)
    setLevel(participant?.level ?? 1)
    setPosts(data.posts ?? [])
    setSettlements(data.settlements ?? [])

    const settledAmount = data.settlements
      ?.filter((s: any) => ['PENDING', 'APPROVED'].includes(s.status))
      .reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0) ?? 0
    setAvailableBalance(Math.max(0, (participant?.balance ?? 0) - settledAmount))

    if (data.posts && data.posts.length > 0) {
      const codes = [...new Set(data.posts.map((p: any) => p.project_code))]
      const projectsRes = await fetch(`/api/projects?codes=${codes.join(',')}`)
      const projects = await projectsRes.json()
      const map: any = {}
      projects?.forEach((p: any) => { map[p.project_code.toUpperCase()] = p })
      setProjectsMap(map)
    }
    setLoading(false)
  }

  const earnHistory = posts.map(post => {
    const project = projectsMap[post.project_code?.toUpperCase()]
    const baseAmount = project?.reward_per_post ?? 0
    const earnAmount = getLevelAmount(baseAmount, level)
    return {
      type: 'earn',
      date: post.created_at,
      label: project?.artist_name || project?.client_name || post.project_code,
      sub: post.project_code,
      amount: earnAmount,
    }
  })

  const exchangeHistory = settlements.map(s => ({
    type: 'exchange',
    date: s.requested_at,
    label: '환전 신청',
    sub: `실수령 ${s.net_amount?.toLocaleString()}P`,
    amount: s.amount,
    status: s.status,
  }))

  const allHistory = [...earnHistory, ...exchangeHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filteredHistory = filter === 'earn'
    ? earnHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : filter === 'exchange'
    ? exchangeHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : allHistory

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">로딩 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-xl">←</button>
          <h1 className="text-xl font-bold">적립금</h1>
        </div>

        <div className="bg-blue-600 rounded-2xl p-5 mb-4 text-white">
          <p className="text-sm text-blue-200 mb-1">환전 가능 금액</p>
          <p className="text-3xl font-bold">{availableBalance.toLocaleString()}P</p>
          <p className="text-xs text-blue-200 mt-2">종료된 프로젝트 수익 + 댓글 미션 수익</p>
          <button onClick={() => router.push('/participant')} className="mt-3 w-full bg-white text-blue-600 rounded-xl py-2 text-sm font-medium">
            환전 신청하기
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">총 적립금</p>
              <p className="text-2xl font-bold text-gray-800">{balance.toLocaleString()}P</p>
            </div>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs border rounded-lg px-3 py-2 text-gray-600">
              {showHistory ? '내역 접기 ▲' : '적립금 내역 ▼'}
            </button>
          </div>

          {showHistory && (
            <div className="mt-4 border-t pt-4">
              <div className="flex gap-2 mb-3">
                {(['all', 'earn', 'exchange'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === f ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>
                    {f === 'all' ? '전체' : f === 'earn' ? '적립' : '환전신청'}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">내역이 없습니다.</p>
                ) : (
                  filteredHistory.map((item, i) => (
                    <div key={i} className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                        <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('ko-KR')}</p>
                        {item.type === 'exchange' && (item as any).status && (
                          <div className="mt-0.5">{settlementStatusLabel((item as any).status)}</div>
                        )}
                      </div>
                      <p className={`text-sm font-bold ${item.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                        {item.type === 'earn' ? '+' : '-'}{item.amount?.toLocaleString()}P
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
