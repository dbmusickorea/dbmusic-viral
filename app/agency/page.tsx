'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../../app/lib/fetchWithAuth'
import AdminBottomNav from '../../components/AdminBottomNav'
import Sidebar from '../../components/Sidebar'
import { Users, ChevronDown, ChevronUp, RefreshCw, ArrowDown } from 'lucide-react'
import { useToast } from '../../components/ToastContext'

export default function AgencyPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [agencies, setAgencies] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const res = await fetchWithAuth('/api/participants')
    const data = await res.json()
    const allMembers = Array.isArray(data) ? data : []
    setMembers(allMembers)
    setAgencies(allMembers.filter((p: any) => p.is_agency))
    setLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    setPullStartY(0)
    setIsPulling(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const getAgencyMembers = (agency: any) => {
    return members.filter(m => m.referred_by === agency.referral_code && !m.is_agency)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/admin') },
          { icon: '🏢', label: '의뢰인', onClick: () => router.push('/client') },
          { icon: '👤', label: '회원관리', onClick: () => router.push('/members') },
          { icon: '💰', label: '정산', onClick: () => router.push('/settlement') },
          { icon: '🎵', label: '커버', onClick: () => router.push('/cover') },
          { icon: '🏢', label: '에이전시', onClick: () => router.push('/agency'), active: true },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/admin-mypage') },
        ]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
        onTouchStart={(e) => {
          if (document.documentElement.scrollTop === 0) setPullStartY(e.touches[0].clientY)
          else setPullStartY(0)
        }}
        onTouchMove={(e) => {
          if (pullStartY === 0) return
          if (e.touches[0].clientY - pullStartY > 70) setIsPulling(true)
        }}
        onTouchEnd={() => {
          if (isPulling) handleRefresh()
          setIsPulling(false)
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
            {(isPulling || isRefreshing) && (
              <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
                {isRefreshing ? <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</> : <><ArrowDown size={14} /> 놓으면 새로고침</>}
              </div>
            )}
            <div className="flex justify-center mb-2">
              <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">관리자</p>
                  <h1 className="text-lg font-bold dark:text-white">에이전시 관리</h1>
                </div>
              </div>
            </div>
          </div>

          {agencies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center text-gray-400">
              등록된 에이전시가 없어요.
            </div>
          ) : (
            <div className="space-y-3">
              {agencies.map(agency => {
                const agencyMembers = getAgencyMembers(agency)
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
                            <span className="text-xs text-green-600 font-medium">잔액 {(agency.agency_balance ?? 0).toLocaleString()}P</span>
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
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Lv.{m.level ?? 1}</span>
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
      </div>
      <AdminBottomNav active="agency" />
    </>
  )
}
