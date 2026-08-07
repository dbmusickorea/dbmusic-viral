'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../../app/lib/fetchWithAuth'
import { Users, ChevronDown, ChevronUp, Wallet } from 'lucide-react'

export default function AgencyMemberPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info || role !== 'participant') { router.push('/'); return }
    const parsed = JSON.parse(info)
    if (!parsed?.is_agency) { router.push('/participant'); return }
    setUserInfo(parsed)
    fetchData(parsed)
  }, [])

  const fetchData = async (info: any) => {
    setLoading(true)
    const [membersRes, projectsRes, pointRes] = await Promise.all([
      fetchWithAuth(`/api/participants?referred_by=${info.referral_code}`),
      fetchWithAuth('/api/projects'),
      fetchWithAuth(`/api/point_history?member_id=${info.id}`)
    ])
    const membersData = await membersRes.json()
    const projectsData = await projectsRes.json()
    const pointData = await pointRes.json()

    // 소속 체험단 point_history 가져오기
    const memberIds = Array.isArray(membersData) ? membersData.map((m: any) => m.id) : []
    let allPointHistory: any[] = []
    if (memberIds.length > 0) {
      const phRes = await fetchWithAuth(`/api/point_history?member_ids=${memberIds.join(',')}`)
      allPointHistory = await phRes.json()
    }

    setMembers(Array.isArray(membersData) ? membersData : [])
    setProjects(Array.isArray(projectsData) ? projectsData.filter((p: any) => p.status === 'COMPLETED') : [])
    setPointHistory(Array.isArray(allPointHistory) ? allPointHistory : [])
    setLoading(false)
  }

  const getProjectReward = (projectCode: string) => {
    return pointHistory
      .filter(ph => ph.project_code === projectCode && members.some(m => m.id === ph.member_id) && ph.amount > 0)
      .reduce((sum, ph) => sum + ph.amount, 0)
  }

  const getProjectCommission = (projectCode: string) => {
    return Math.floor(getProjectReward(projectCode) * (userInfo?.agency_commission ?? 0) / 100)
  }

  const getProjectMembers = (projectCode: string) => {
    const memberIds = new Set(
      pointHistory.filter(ph => ph.project_code === projectCode && ph.amount > 0).map(ph => ph.member_id)
    )
    return members.filter(m => memberIds.has(m.id))
  }

  // 실제 참여한 프로젝트만
  const participatedProjects = projects.filter(p => getProjectReward(p.project_code) > 0)

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold dark:text-white">에이전시 현황</h1>
          <button onClick={() => router.back()} className="text-sm text-gray-500">← 뒤로</button>
        </div>

        {/* 요약 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <p className="text-sm font-medium dark:text-white mb-3">{userInfo?.agency_name}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">소속 체험단</p>
              <p className="text-lg font-bold text-blue-600">{members.length}명</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">수수료율</p>
              <p className="text-lg font-bold text-orange-600">{userInfo?.agency_commission ?? 0}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">수수료 잔액</p>
              <p className="text-lg font-bold text-green-600">{(userInfo?.agency_balance ?? 0).toLocaleString()}P</p>
            </div>
          </div>
          {(userInfo?.agency_balance ?? 0) > 0 && (
            <button onClick={() => router.push('/agency-wallet')} className="w-full mt-3 bg-green-600 text-white rounded-xl py-2 text-sm font-medium flex items-center justify-center gap-1">
              <Wallet size={14} /> 수수료 환전 신청
            </button>
          )}
        </div>

        {/* 소속 체험단 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold dark:text-white mb-3 flex items-center gap-1"><Users size={16} /> 소속 체험단 ({members.length}명)</h2>
          {members.length === 0 ? (
            <p className="text-xs text-gray-400">소속 체험단이 없어요. 추천인 코드를 공유해보세요!</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.instagram_id || m.youtube_id || m.tiktok_id || '-'}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Lv.{m.level ?? 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 프로젝트별 수수료 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold dark:text-white mb-3">프로젝트별 수수료</h2>
          {participatedProjects.length === 0 ? (
            <p className="text-xs text-gray-400">완료된 프로젝트가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {participatedProjects.map(p => {
                const reward = getProjectReward(p.project_code)
                const commission = getProjectCommission(p.project_code)
                const projectMembers = getProjectMembers(p.project_code)
                const isExpanded = expanded === p.project_code

                return (
                  <div key={p.project_code} className="border dark:border-gray-600 rounded-lg">
                    <div className="p-3 cursor-pointer flex justify-between items-center" onClick={() => setExpanded(isExpanded ? null : p.project_code)}>
                      <div>
                        <p className="text-sm font-medium dark:text-white">{p.artist_name || p.client_name} - {p.song_title}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-500">참여 {projectMembers.length}명</span>
                          <span className="text-xs text-gray-500">리워드 {reward.toLocaleString()}P</span>
                          <span className="text-xs text-green-600 font-medium">수수료 {commission.toLocaleString()}P</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                    {isExpanded && (
                      <div className="border-t dark:border-gray-600 p-3 space-y-1">
                        {projectMembers.map(m => {
                          const memberReward = pointHistory.filter(ph => ph.project_code === p.project_code && ph.member_id === m.id && ph.amount > 0).reduce((sum, ph) => sum + ph.amount, 0)
                          return (
                            <div key={m.id} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600 dark:text-gray-300">{m.name}</span>
                              <span className="text-gray-500">{memberReward.toLocaleString()}P → 수수료 {Math.floor(memberReward * (userInfo?.agency_commission ?? 0) / 100).toLocaleString()}P</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
