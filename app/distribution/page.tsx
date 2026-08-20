'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { LayoutGrid, BarChart2, FileText, User, Disc3, RefreshCw, ArrowDown } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'
import BottomNav from '../../components/BottomNav'
import Sidebar from '../../components/Sidebar'

export default function DistributionPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [hasProjects, setHasProjects] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      const parsed = JSON.parse(stored)
      await fetchAllData(parsed.id, parsed.client_id)
    }
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    localStorage.removeItem('autoLogin')
    router.push('/')
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const stored = localStorage.getItem('userInfo')
    if (role !== 'client' || !stored) { router.push('/'); return }
    const parsed = JSON.parse(stored)
    if (!parsed.has_distribution) { router.push('/client'); return }

    setUserInfo(parsed)
    fetchAllData(parsed.id, parsed.client_id)
  }, [])

  const fetchAllData = async (userId: number, clientId: string) => {
    const [userRes, itemsRes, projectsRes] = await Promise.all([
      fetchWithAuth(`/api/users?id=${userId}`),
      fetchWithAuth(`/api/distribution-items?client_id=${userId}`),
      fetchWithAuth(`/api/projects?client_id=${clientId}`)
    ])

    const userData = await userRes.json()
    const latestUser = Array.isArray(userData) ? userData[0] : userData
    if (!latestUser?.has_distribution) {
      const stored = localStorage.getItem('userInfo')
      const parsed = stored ? JSON.parse(stored) : {}
      const updated = { ...parsed, has_distribution: false }
      localStorage.setItem('userInfo', JSON.stringify(updated))
      router.push('/client')
      return
    }
    const itemsData = await itemsRes.json()
    const projectsData = await projectsRes.json()
    setItems(Array.isArray(itemsData) ? itemsData : [])
    setHasProjects(Array.isArray(projectsData) && projectsData.length > 0)
    setDataLoading(false)
  }

  const platformLabel = (p: string) => p === 'youtube' ? '유튜브' : p === 'instagram' ? '인스타그램 릴스' : '틱톡'
  const platformIconKey = (type: string, p: string) => type === 'shorts' && p === 'youtube' ? 'youtube_shorts' : p

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          ...(hasProjects ? [
            { icon: '', label: '프로젝트', onClick: () => router.push('/client') },
            { icon: '', label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
            { icon: '', label: '프로젝트 신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
            { icon: '', label: '보고서', onClick: () => router.push('/client-report') },
          ] : []),
          { icon: '', label: '유통 서비스', onClick: () => router.push('/distribution'), active: true },
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
          <div className="flex justify-center mb-2">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => { if (hasProjects) router.push('/client'); else window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold dark:text-white">{userInfo?.name}님의 유통 서비스</h1>
            </div>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="font-bold dark:text-white mb-3">등록된 콘텐츠</h2>
              {items.length === 0 ? (
                <p className="text-xs text-gray-400">등록된 콘텐츠가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <PlatformIcon platform={platformIconKey(item.type, item.platform)} size={18} className="shrink-0" />
                      <div>
                        <p className="text-sm font-medium dark:text-white">{item.type === 'lyric_video' ? '리릭비디오' : platformLabel(item.platform)}</p>
                        {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400 mb-1">{item.artist_name} - {item.song_title}</p>}
                        <p className="text-xs text-blue-500 break-all">{item.url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav tabs={[
        ...(hasProjects ? [
          { icon: <LayoutGrid size={20} />, label: '프로젝트', href: '/client' },
          { icon: <BarChart2 size={20} />, label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
          { icon: <FileText size={20} />, label: '신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
          { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, label: '보고서', onClick: () => { router.push('/client-report') } },
        ] : []),
        { icon: <Disc3 size={20} />, label: '유통', href: '/distribution', active: true },
        { icon: <User size={20} />, label: '마이페이지', href: '/client-mypage' },
      ]} />
    </>
  )
}
