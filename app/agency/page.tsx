'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../../app/lib/fetchWithAuth'
import AdminBottomNav from '../../components/AdminBottomNav'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'

export default function AgencyPage() {
  const router = useRouter()
  const [agencies, setAgencies] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [participantsRes, projectsRes] = await Promise.all([
      fetchWithAuth('/api/participants'),
      fetchWithAuth('/api/projects')
    ])
    const participantsData = await participantsRes.json()
    const projectsData = await projectsRes.json()
    setMembers(Array.isArray(participantsData) ? participantsData : [])
    setProjects(Array.isArray(projectsData) ? projectsData : [])
    setAgencies(Array.isArray(participantsData) ? participantsData.filter((p: any) => p.is_agency) : [])
    setLoading(false)
  }

  const getAgencyMembers = (agency: any) => {
    return members.filter(m => m.referred_by === agency.referral_code && !m.is_agency)
  }

  const getMemberProjects = (memberId: number) => {
    return projects.filter(p => p.participants?.some((pt: any) => pt.member_id === memberId))
  }

  const getAgencyCommission = (agency: any) => {
    const agencyMembers = getAgencyMembers(agency)
    let total = 0
    agencyMembers.forEach(m => {
      // point_history에서 해당 회원의 프로젝트별 리워드 합계
      total += m.balance ?? 0
    })
    return Math.floor(total * (agency.agency_commission ?? 0) / 100)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4 dark:text-white">에이전시 관리</h1>

        {agencies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center text-gray-400">
            등록된 에이전시가 없어요.
          </div>
        ) : (
          <div className="space-y-3">
            {agencies.map(agency => {
              const agencyMembers = getAgencyMembers(agency)
              const commission = getAgencyCommission(agency)
              const isExpanded = expanded === agency.id

              return (
                <div key={agency.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow">
                  <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : agency.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold dark:text-white">{agency.agency_name ?? agency.name}</p>
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">에이전시</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{agency.name} · {agency.email}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5"><Users size={10} /> 소속 {agencyMembers.length}명</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">수수료 {agency.agency_commission ?? 0}%</span>
                          <span className="text-xs text-blue-600 font-medium">예상 수수료 {commission.toLocaleString()}원</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t dark:border-gray-700 p-4">
                      <p className="text-sm font-medium dark:text-white mb-3">소속 체험단 ({agencyMembers.length}명)</p>
                      {agencyMembers.length === 0 ? (
                        <p className="text-xs text-gray-400">소속 체험단이 없어요.</p>
                      ) : (
                        <div className="space-y-2">
                          {agencyMembers.map(m => (
                            <div key={m.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium dark:text-white">{m.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{m.instagram_id || m.youtube_id || m.tiktok_id || '-'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-blue-600">{m.balance?.toLocaleString() ?? 0}P</p>
                                <p className="text-xs text-gray-400">수수료 {Math.floor((m.balance ?? 0) * (agency.agency_commission ?? 0) / 100).toLocaleString()}원</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <AdminBottomNav active="agency" />
    </div>
  )
}
