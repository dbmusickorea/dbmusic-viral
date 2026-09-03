'use client'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { BarChart2, LayoutGrid, FileText, User, Disc3, RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../components/ToastContext'
import ApplyModal from '../../components/ApplyModal'

export default function ClientReportPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!userInfo || (role !== 'client' && role !== 'admin')) {
      router.push('/')
      return
    }
    const parsed = JSON.parse(userInfo)
    setUserInfo(parsed)
    if (parsed?.id) {
      fetchWithAuth(`/api/users?id=${parsed.id}`).then(res => res.json()).then(data => {
        const latest = Array.isArray(data) ? data[0] : data
        const updatedUser = { ...parsed, has_distribution: !!latest?.has_distribution }
        setUserInfo(updatedUser)
        localStorage.setItem('userInfo', JSON.stringify(updatedUser))
      }).catch(() => {})
    }
    const clientId = parsed.client_id
    if (clientId) {
      fetchWithAuth(`/api/projects?client_id=${clientId}`)
        .then(res => res.json())
        .then(data => { setMyProjects(data ?? []); setDataLoading(false) })
    } else {
      setDataLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.client_id) {
        const res = await fetchWithAuth(`/api/projects?client_id=${parsed.client_id}`)
        const data = await res.json()
        setMyProjects(data ?? [])
      }
    }
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <>
      <ApplyModal show={showApplyModal} onClose={() => setShowApplyModal(false)} userInfo={userInfo} />
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '', label: '프로젝트', onClick: () => router.push('/client') },
          { icon: '', label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
          { icon: '', label: '프로젝트 신청', onClick: () => setShowApplyModal(true) },
          { icon: '', label: '보고서', onClick: () => {}, active: true },
          
          { icon: '', label: '마이페이지', onClick: () => router.push('/client-mypage') },
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
        style={{paddingTop: "calc(env(safe-area-inset-top) + 1rem)"}}>
        <div className="max-w-7xl mx-auto">
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
              {isRefreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
              ) : (
                <><ArrowDown size={14} /> 놓으면 새로고침</>
              )}
            </div>
          )}
          <div className="flex justify-center mb-2 max-w-7xl mx-auto">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/client')} />
          </div>
          <div className="flex items-center mb-2">
            <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-4 dark:text-white flex items-center gap-1"><BarChart2 size={16} /> 결과보고서</h2>
            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : myProjects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">프로젝트가 없어요</p>
            ) : (
              <div className="space-y-3">
                {myProjects.map((p: any) => (
                  <div key={p.project_code} className="border dark:border-gray-600 dark:bg-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm dark:text-white">{p.artist_name ?? p.client_name} / {p.song_title ?? p.product_content}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{p.start_date} ~ {p.end_date}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${p.status === 'ONGOING' ? 'bg-green-100 text-green-700' : p.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.status === 'ONGOING' ? '진행중' : p.status === 'COMPLETED' ? '완료' : '대기'}
                        </span>
                      </div>
                      {p.status === 'COMPLETED' ? (
                        <button onClick={async () => {
                          const url = `${window.location.origin}/report?project_code=${p.project_code}`
                          if ((window as any).Capacitor?.isNativePlatform?.()) {
                            const { Browser } = await import('@capacitor/browser')
                            await Browser.open({ url })
                          } else {
                            window.open(url, '_blank')
                          }
                        }} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg shrink-0">
                          결과보고서 받기
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-lg shrink-0 text-center">종료 후<br/>확인 가능</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단탭 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex md:hidden z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
          <button onClick={() => router.push('/client')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <LayoutGrid size={20} className="mb-0.5" />프로젝트
          </button>
          <button onClick={() => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') }} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <BarChart2 size={20} className="mb-0.5" />현황
          </button>
          <button onClick={() => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') }} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <FileText size={20} className="mb-0.5" />신청
          </button>
          <button className="flex-1 flex flex-col items-center py-3 text-xs text-blue-600">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>보고서
          </button>
          {userInfo?.has_distribution && (
            <button onClick={() => router.push('/distribution')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
              <Disc3 size={20} className="mb-0.5" />유통
            </button>
          )}
          <button onClick={() => router.push('/client-mypage')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <User size={20} className="mb-0.5" />마이페이지
          </button>
        </div>
        <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
      </div>
    </>
  )
}
