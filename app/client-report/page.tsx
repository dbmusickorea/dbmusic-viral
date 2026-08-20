'use client'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { BarChart2 } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../components/ToastContext'
import ApplyModal from '../../components/ApplyModal'

export default function ClientReportPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

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
        .then(data => { setMyProjects(data ?? []); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center h-screen">로딩중...</div>

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
          ...(userInfo?.has_distribution ? [{ icon: '', label: '유통 서비스', onClick: () => router.push('/distribution') }] : []),
          { icon: '', label: '마이페이지', onClick: () => router.push('/client-mypage') },
        ]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{paddingTop: "calc(env(safe-area-inset-top) + 1rem)"}}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-2 max-w-7xl mx-auto">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/client')} />
          </div>
          <div className="flex items-center mb-2">
            <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-4 dark:text-white flex items-center gap-1"><BarChart2 size={16} /> 결과보고서</h2>
            {myProjects.length === 0 ? (
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
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>프로젝트
          </button>
          <button onClick={() => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') }} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>현황
          </button>
          <button onClick={() => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') }} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>신청
          </button>
          <button className="flex-1 flex flex-col items-center py-3 text-xs text-blue-600">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>보고서
          </button>
          {userInfo?.has_distribution && (
            <button onClick={() => router.push('/distribution')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
              <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>유통
            </button>
          )}
          <button onClick={() => router.push('/client-mypage')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 dark:text-gray-500">
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>마이페이지
          </button>
        </div>
        <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
      </div>
    </>
  )
}
