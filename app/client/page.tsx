'use client'
import { fetchWithAuth } from '../lib/fetchWithAuth'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell, ClipboardList, Package, BarChart2, TrendingUp, Share2, MessageSquare, Music, Link, Trophy, Users, LayoutGrid, FileText, User, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Eye, EyeOff } from 'lucide-react'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { Heart, ThumbsUp, MessageCircle, PlayCircle } from 'lucide-react'
import { useToast } from '../../components/ToastContext'
import AdminBottomNav from '../../components/AdminBottomNav'
import GuideCard from '../../components/GuideCard'
import ClientTutorial from '../../components/ClientTutorial'
import ApplyModal from '../../components/ApplyModal'
import StatsChart from '../../components/StatsChart'
import PlatformIcon from '../../components/PlatformIcon'
import Sidebar from '../../components/Sidebar'

export default function Page3() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [appVersion, setAppVersion] = useState('0')
  const [userRole, setUserRole] = useState('')
  const [clientCode, setClientCode] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [coverRequests, setCoverRequests] = useState<any[]>([])
  const [projectLinks, setProjectLinks] = useState<any[]>([])
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('desc')
  const [commentMissionData, setCommentMissionData] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [showRequestForm, setShowRequestForm] = useState(true)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestContent, setRequestContent] = useState('')
  const [requestedPosts, setRequestedPosts] = useState('1')
  const [myName, setMyName] = useState('')
  const [myCompany, setMyCompany] = useState('')
  const [myArtist, setMyArtist] = useState('')
  const [myPhone, setMyPhone] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [myProjectPage, setMyProjectPage] = useState(0)
  const [allProjectPage, setAllProjectPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'project' | 'stats' | 'apply' | 'report'>('project')
  const [postPage, setPostPage] = useState(0)
  const [topRanker, setTopRanker] = useState<any>(null)
  const [igAudioCount, setIgAudioCount] = useState<number | null>(null)
  const [ttAudioCount, setTtAudioCount] = useState<number | null>(null)
  const [artistList, setArtistList] = useState<any[]>([])
  const [newArtistName, setNewArtistName] = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [ytAudioCount, setYtAudioCount] = useState<number | null>(null)
  const [requestCategory, setRequestCategory] = useState('')
  const postsRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 5
  const router = useRouter()
  const { showToast } = useToast()
  const [applyJacketImage, setApplyJacketImage] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)


  useEffect(() => {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      import('@capacitor/app').then(({ App }) => {
        App.getInfo().then(info => setAppVersion(info.version))
      }).catch(() => {})
    }
    const tab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    if (tab === 'apply') {
      setShowApplyModal(true)
    } else if (tab === 'stats') {
      setActiveTab('stats')
    }
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    if ((window as any).Capacitor) {
      import('@capawesome/capacitor-badge').then(({ Badge }) => Badge.clear()).catch(() => {})
    }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')

    const loadData = async () => {
      await Promise.all([
        fetchNotifications(String(parsed.id)),
        role === 'client' && parsed.client_id ? Promise.all([
          fetchMyProjects(parsed.client_id),
          fetchRequests(parsed.client_id)
        ]) : role === 'admin' ? fetchAllProjects() : Promise.resolve()
      ])
    }
    loadData().then(() => {
      const savedTab = sessionStorage.getItem('clientTab')
      console.log('savedTab after loadData:', savedTab)
      if (savedTab === 'stats' || savedTab === 'apply' || savedTab === 'report') {
        console.log('setActiveTab 호출:', savedTab)
        setActiveTab(savedTab as 'stats' | 'apply' | 'report')
        sessionStorage.removeItem('clientTab')
      }
      // 튜토리얼 첫 방문 체크
      if (!localStorage.getItem('clientTutorialDone') && role === 'client') {
        setTimeout(() => setShowTutorial(true), 1000)
      }
    })
  }, [])

  const fetchRequests = async (clientId: string) => {
    const res = await fetch(`/api/client_requests?client_id=${clientId}`)
    const data = await res.json()
    setRequests(data ?? [])
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { showToast('제목과 내용을 입력해주세요.'); return }
    const res = await fetch('/api/client_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: userInfo?.client_id,
        client_name: userInfo?.name,
        client_mobile: userInfo?.mobile,
        title: requestTitle,
        content: requestContent,
        requested_posts: Number(requestedPosts),
        project_code: projectInfo?.project_code ?? null
      })
    })
    if (!res.ok) { showToast('등록 실패!'); return }
    showToast('✅ 프로젝트 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    // 관리자에게 푸시 알림 발송
    const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
    const adminTokens = await adminTokensRes.json()
    const adminUsersRes = await fetchWithAuth('/api/users?role=admin')
    const adminUsers = await adminUsersRes.json()
    const adminUserIds = adminUsers?.map((u: any) => String(u.id)) ?? []
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📋 새 프로젝트 문의',
        body: `${userInfo?.name}님이 문의를 등록했어요: ${requestTitle}`,
        tokens: adminTokens?.map((t: any) => t.token) ?? [],
        userIds: adminUserIds
      })
    })
    fetchRequests(userInfo?.client_id)
  }

  const fetchAllProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setAllProjects(data ?? [])
  }

  const fetchMyProjects = async (clientId: string) => {
    console.log('fetchMyProjects called')
    const res = await fetch(`/api/projects?client_id=${clientId}`)
    const data = await res.json()
    setMyProjects(data ?? [])
    const active = data?.filter((p: any) => p.status === 'ONGOING')
    if (active && active.length === 1) {
      setProjectInfo(active[0])
      setClientCode(active[0].project_code)
      setIgAudioCount(active[0].instagram_audio_count ?? null)
      setTtAudioCount(active[0].tiktok_audio_count ?? null)
      setYtAudioCount(active[0].youtube_audio_count ?? null)
      fetchPosts(active[0].project_code)
      fetchCommentMissionData(active[0].project_code)
      fetchDailyStats(active[0].project_code, active[0].instagram_audio_count ?? null, active[0].tiktok_audio_count ?? null, active[0].youtube_audio_count ?? null)
    }
  }

  const fetchPosts = async (code: string) => {
    const res = await fetchWithAuth(`/api/posts?project_code=${code}`)
    const data = await res.json()
    
    if (data && data.length > 0) {
      const memberIds = [...new Set(data.map((p: any) => p.member_id))].join(',')
      const participantsRes = await fetchWithAuth(`/api/participants?ids=${memberIds}`)
      const participantsData = await participantsRes.json()
      
      const merged = data.map((post: any) => ({
        ...post,
        participant: participantsData?.find((p: any) => p.id === post.member_id)
      }))
      setPosts(merged)
    } else {
      setPosts(data ?? [])
    }
    const linksRes = await fetch(`/api/project_links?project_code=${code}`)
    const linksData = await linksRes.json()
    setProjectLinks(linksData ?? [])
    
    const coverReqRes = await fetch(`/api/cover_requests?project_code=${code}&status=PENDING`)
    const coverReqData = await coverReqRes.json()
    if (Array.isArray(coverReqData) && coverReqData.length > 0) {
      const pIds = coverReqData.map((r: any) => r.participant_id).join(',')
      const pRes = await fetchWithAuth(`/api/participants?ids=${pIds}`)
      const pData = await pRes.json()
      const now = new Date()
      setCoverRequests(coverReqData.map((r: any) => ({
        ...r,
        participants: pData?.find((p: any) => p.id === r.participant_id)
      })).filter((r: any) => !r.participants?.cover_penalty_until || new Date(r.participants.cover_penalty_until) <= now))
    } else {
      setCoverRequests([])
    }
  }

  const fetchCommentMissionData = async (code: string) => {
    const [videosRes, missionsRes, linksRes] = await Promise.all([
      fetch(`/api/project_videos?project_code=${code}`),
      fetch(`/api/comment_missions?project_code=${code}&status=APPROVED`),
      fetch(`/api/project_links?project_code=${code}`)
    ])
    const videos = await videosRes.json()
    const missions = await missionsRes.json()
    const links = await linksRes.json()
    if (videos || links?.length > 0) {
      setCommentMissionData({
        videos,
        missions: missions ?? [],
        links: links ?? []
      })
    } else {
      setCommentMissionData(null)
    }
  }

  const handleSelectProject = (project: any) => {
    setProjectInfo(project)
    setClientCode(project.project_code)
    setIgAudioCount(project.instagram_audio_id ? (project.instagram_audio_count ?? null) : null)
    setTtAudioCount(project.tiktok_audio_id ? (project.tiktok_audio_count ?? null) : null)
    setYtAudioCount(project.youtube_audio_id ? (project.youtube_audio_count ?? null) : null)
    fetchPosts(project.project_code)
    fetchCommentMissionData(project.project_code)
    fetchDailyStats(project.project_code, project.instagram_audio_id ? (project.instagram_audio_count ?? null) : null, project.tiktok_audio_id ? (project.tiktok_audio_count ?? null) : null, project.youtube_audio_id ? (project.youtube_audio_count ?? null) : null)
    setActiveTab('stats')
    setPostPage(0)
    setTimeout(() => postsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }

  const handleCodeChange = (code: string) => {
    setClientCode(code)
    if (code) {
      const found = allProjects.find(p => p.project_code.toLowerCase() === code.toLowerCase())
      if (found) { setProjectInfo(found); fetchPosts(found.project_code) }
      else { setProjectInfo(null); setPosts([]) }
    } else { setProjectInfo(null); setPosts([]) }
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const info = localStorage.getItem('userInfo')
    if (info) {
      const parsed = JSON.parse(info)
      const role = localStorage.getItem('userRole')
      if (role === 'client' && parsed.client_id) {
        await fetchMyProjects(parsed.client_id)
        await fetchRequests(parsed.client_id)
      } else if (role === 'admin') {
        await fetchAllProjects()
      }
      await fetchNotifications(String(parsed.id))
    }
    setIsRefreshing(false)
  }


  const handleUpdateMyInfo = async () => {
    // 비밀번호 변경 시 기존 비밀번호 확인
    if (myPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userInfo?.email,
        password: myCurrentPassword
      })
      if (authError) { showToast('기존 비밀번호가 틀렸어요.'); return }
      await supabase.auth.updateUser({ password: myPassword })
    }
    const updateData: any = {
      name: myName, company: myCompany, artist: myArtist,
      phone: myPhone, mobile: myMobile
    }
    const res = await fetchWithAuth(`/api/users?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { showToast('수정 실패!'); return }
    const updated = { ...userInfo, name: myName, company: myCompany, artist: myArtist, phone: myPhone, mobile: myMobile }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    showToast('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
  }

  const fetchNotifications = async (id: string) => {
    const res = await fetch(`/api/notifications?user_id=${id}`)
    const data = await res.json()
    setNotifications(data ?? [])
    setUnreadCount(data?.filter((n: any) => !n.is_read).length ?? 0)
  }

  const fetchDailyStats = async (projectCode: string, igAudio: number | null = null, ttAudio: number | null = null, ytAudio: number | null = null) => {
    const res = await fetch(`/api/post_stats_history?project_code=${projectCode}`)
    const data = await res.json()
    
    // 커버영상 데이터
    const coverRes = await fetchWithAuth(`/api/posts?project_code=${projectCode}&is_cover=true`)
    const coverData = await coverRes.json()
    
    if (data && data.length > 0) {
      const dates = [...new Set(data.map((h: any) => h.recorded_at.includes('_') ? h.recorded_at.split('_')[0] : h.recorded_at))].sort()
      const stats: any[] = dates.map(date => {
        const dayData = data.filter((h: any) => h.recorded_at === date || h.recorded_at.startsWith(date + '_'))
        const getLatestPerPost = (data: any[]) => {
          const map = new Map()
          data.forEach((h: any) => {
            const key = h.link_id ? `link_${h.link_id}` : `post_${h.post_id}`
            const hour = parseInt(h.recorded_at.split('_')[1] ?? '0')
            const existing = map.get(key)
            const existingHour = existing ? parseInt(existing.recorded_at.split('_')[1] ?? '0') : -1
            if (!existing || hour > existingHour) {
              map.set(key, h)
            }
          })
          return Array.from(map.values())
        }
        const igData = getLatestPerPost(dayData.filter((h: any) => h.platform === 'instagram'))
        const ytData = getLatestPerPost(dayData.filter((h: any) => ['youtube', 'youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(h.platform)))
        const ttData = getLatestPerPost(dayData.filter((h: any) => h.platform === 'tiktok'))
        const coverCount = coverData?.filter((p: any) => p.created_at?.startsWith(date))?.length ?? 0
        return {
          date,
          ig_likes: igData.reduce((sum: number, h: any) => sum + (h.likes_count ?? 0), 0),
          ig_comments: igData.reduce((sum: number, h: any) => sum + (h.comments_count ?? 0), 0),
          ig_views: igData.reduce((sum: number, h: any) => sum + (h.views_count ?? 0), 0),
          yt_likes: ytData.reduce((sum: number, h: any) => sum + (h.likes_count ?? 0), 0),
          yt_comments: ytData.reduce((sum: number, h: any) => sum + (h.comments_count ?? 0), 0),
          yt_views: ytData.reduce((sum: number, h: any) => sum + (h.views_count ?? 0), 0),
          tt_likes: ttData.reduce((sum: number, h: any) => sum + (h.likes_count ?? 0), 0),
          tt_comments: ttData.reduce((sum: number, h: any) => sum + (h.comments_count ?? 0), 0),
          tt_views: ttData.reduce((sum: number, h: any) => sum + (h.views_count ?? 0), 0),
          cover_count: coverCount > 0 ? coverCount : null,
        }
      })
      if (stats.length > 0) {
        stats[stats.length - 1] = {
          ...stats[stats.length - 1],
          ig_audio: igAudio,
          tt_audio: ttAudio,
          yt_audio: ytAudio
        }
      }
      setDailyStats(stats)
    }
  }

  const markAllRead = async (id: string) => {
    await fetch(`/api/notifications?user_id=${id}`, { method: 'PATCH' })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteAllNotifications = async (userId: string) => {
    await fetch(`/api/notifications?user_id=${userId}`, { method: 'DELETE' })
    setNotifications([])
    setUnreadCount(0)
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0) + projectLinks.reduce((sum, l) => sum + (l.likes_count ?? 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0) + projectLinks.reduce((sum, l) => sum + (l.comments_count ?? 0), 0)

  const instagramPosts = posts.filter(p => p.platform === 'instagram')
  const youtubePosts = posts.filter(p => p.platform === 'youtube')
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok')
  const instagramLinks = projectLinks.filter(l => l.platform === 'instagram')
  const youtubeLinks = projectLinks.filter(l => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(l.platform))
  const tiktokLinks = projectLinks.filter(l => l.platform === 'tiktok')

  const snsList = [
    { label: '인스타그램', posts: instagramPosts, links: instagramLinks, icon: <PlatformIcon platform="instagram" size={16} /> },
    { label: '유튜브', posts: youtubePosts, links: youtubeLinks, icon: <PlatformIcon platform="youtube" size={16} /> },
    { label: '틱톡', posts: tiktokPosts, links: tiktokLinks, icon: <PlatformIcon platform="tiktok" size={16} /> },
  ]

  const isClient = userRole === 'client'

  const filteredProjects = allProjects
    .filter(p => statusFilter === 'ALL' ? true : p.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  return (
    <>
      <ApplyModal show={showApplyModal} onClose={() => setShowApplyModal(false)} userInfo={userInfo} showToast={showToast} />
      {/* 사이드바 오버레이 */}
      {userRole === 'admin' ? (
        <Sidebar
          show={showSidebar}
          onClose={() => setShowSidebar(false)}
          onLogout={handleLogout}
          items={[
            { icon: '', label: '프로젝트', onClick: () => router.push('/admin') },
            { icon: '', label: '의뢰인', onClick: () => {}, active: true },
            { icon: '', label: '회원관리', onClick: () => router.push('/members') },
            { icon: '', label: '정산', onClick: () => router.push('/settlement') },
            { icon: '', label: '커버', onClick: () => router.push('/cover') },
            { icon: '', label: '마이페이지', onClick: () => router.push('/admin-mypage') },
          ]}
        />
      ) : (
        <Sidebar
          show={showSidebar}
          onClose={() => setShowSidebar(false)}
          onLogout={handleLogout}
          items={[
            { icon: '', label: '프로젝트', onClick: () => setActiveTab('project'), active: activeTab === 'project' },
            { icon: '', label: '현황', onClick: () => setActiveTab('stats'), active: activeTab === 'stats' },
            { icon: '', label: '프로젝트 신청', onClick: () => setShowApplyModal(true) },
            { icon: '', label: '보고서', onClick: () => router.push('/client-report'), active: activeTab === 'report' },
            { icon: '', label: '마이페이지', onClick: () => router.push('/client-mypage') },
          ]}
        />
      )}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        } else {
          setPullStartY(0)
        }
      }}
      onTouchMove={(e) => {
        if (pullStartY === 0) return
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
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
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => { if (userRole === 'admin') router.push('/admin'); else { setActiveTab('project'); window.scrollTo({ top: 0, behavior: 'smooth' }) } }} />
          </div>
          <div className="flex justify-between items-center mb-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">안녕하세요</p>
                <h1 className="text-lg font-bold dark:text-white">{userInfo?.name}님</h1>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => { 
                if (showNotifications) {
                  markAllRead(String(userInfo?.id))
                } else {
                  fetchNotifications(String(userInfo?.id))
                }
                setShowNotifications(!showNotifications)
              }} className="relative text-gray-500">
                <Bell size={22} className="text-gray-600" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-8 z-50 w-80 max-h-[70vh] overflow-y-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold dark:text-white">알림 내역</h2>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button onClick={() => markAllRead(String(userInfo?.id))} className="text-xs text-blue-500 border border-blue-200 rounded px-2 py-1">모두읽음</button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={() => deleteAllNotifications(String(userInfo?.id))} className="text-xs text-red-400 border border-red-200 rounded px-2 py-1">전체 삭제</button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-500 border rounded px-2 py-1">닫기</button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">알림이 없습니다.</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div key={n.id} className={`py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start px-2 -mx-2 ${!n.is_read ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
                            <div className="flex-1">
                              <p className="text-sm font-medium dark:text-white">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{n.body}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={() => deleteNotification(n.id)} className="text-gray-300 hover:text-red-400 ml-2 text-xs">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* 사용 가이드 카드 */}
          {isClient && (
            <GuideCard />
          )}
        <div className="md:grid md:grid-cols-2 md:gap-4">
          
          {/* 왼쪽 컬럼 */}
          <div className={`${activeTab === 'project' ? 'block' : 'hidden'} md:block`}>
            {/* 의뢰인 - 내 프로젝트 목록 */}
            {isClient && (
              <div id="tutorial-project-card" className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium dark:text-white">안녕하세요, <span className="text-blue-600 font-bold">{userInfo?.name}</span>님!</p>
                </div>

                {myProjects.length === 0 && (
                  <>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400 mb-3">프로젝트가 없습니다.</p>
                    </div>
                    <div onClick={() => window.open('/demo', '_blank')} className="border rounded-lg p-3 cursor-pointer border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900 dark:border-blue-700 mt-2">
                      <div className="flex items-center gap-2">
                        <img src="https://tbohdflubypnvlgwjxtp.supabase.co/storage/v1/object/public/covers/A_1_1784796044828" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">옐로 / 결혼해서 좋겠다</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-gray-500 dark:text-gray-400">DEMO · 2026-07-01</p>
                            <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded inline-flex items-center gap-0.5"><Music size={10} /> 커버</span>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500"><Users size={12} className="inline mr-1" />30/30명 · 커버 3/3</p>
                        </div>
                        <span className="text-sm text-blue-600 font-medium shrink-0">샘플 보기 →</span>
                      </div>
                    </div>
                  </>
                )}
                {myProjects.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {myProjects.slice(myProjectPage * PAGE_SIZE, (myProjectPage + 1) * PAGE_SIZE).map((project) => (
                        <div key={project.id} onClick={() => handleSelectProject(project)} className={`border dark:border-gray-600 rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-700'}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {project.cover_image_url && (
                                <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm dark:text-white">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                                  {project.cover_video_count > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded inline-flex items-center gap-0.5"><Music size={10} /> 커버</span>}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500"><Users size={12} className="inline mr-1" />{project.current_participants ?? 0}/{project.max_participants > 0 ? project.max_participants : '∞'}명{project.cover_video_count > 0 ? ` · 커버 ${project.cover_current ?? 0}/${project.cover_video_count}` : ''}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                              {project.status === 'ONGOING' ? '진행중' : project.status === 'PENDING' ? '대기중' : '완료'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {myProjects.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setMyProjectPage(p => Math.max(0, p - 1))} disabled={myProjectPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(myProjects.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setMyProjectPage(i)} className={`text-xs px-2 py-1 border rounded ${myProjectPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setMyProjectPage(p => Math.min(Math.ceil(myProjects.length / PAGE_SIZE) - 1, p + 1))} disabled={(myProjectPage + 1) * PAGE_SIZE >= myProjects.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 관리자 - 프로젝트 목록 */}
            {!isClient && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white">프로젝트 목록</h2>
                <input value={clientCode} onChange={(e) => handleCodeChange(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-3 dark:bg-gray-700 dark:text-white" placeholder="프로젝트 코드 검색 (예: A_1)" />
                <div className="flex gap-2 mb-3">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-2 py-1 text-xs dark:bg-gray-700 dark:text-white">
                    <option value="ALL">전체</option>
                    <option value="ONGOING">진행중</option>
                    <option value="PAUSED">대기중</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-2 py-1 text-xs dark:bg-gray-700 dark:text-white">
                    <option value="desc">최신순</option>
                    <option value="asc">오래된순</option>
                  </select>
                </div>
                {filteredProjects.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">프로젝트가 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {filteredProjects.slice(allProjectPage * PAGE_SIZE, (allProjectPage + 1) * PAGE_SIZE).map((project) => (
                        <div key={project.id} onClick={() => handleSelectProject(project)} className={`border dark:border-gray-600 rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-700'}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {project.cover_image_url && (
                                <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm dark:text-white">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                              {project.status === 'ONGOING' ? '진행중' : project.status === 'PENDING' ? '대기중' : '완료'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredProjects.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setAllProjectPage(p => Math.max(0, p - 1))} disabled={allProjectPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(filteredProjects.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setAllProjectPage(i)} className={`text-xs px-2 py-1 border rounded ${allProjectPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setAllProjectPage(p => Math.min(Math.ceil(filteredProjects.length / PAGE_SIZE) - 1, p + 1))} disabled={(allProjectPage + 1) * PAGE_SIZE >= filteredProjects.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 프로젝트 문의 게시판 */}
            {isClient && (
              <div id="tutorial-inquiry-card" className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold dark:text-white flex items-center gap-1"><ClipboardList size={16} /> 프로젝트 문의</h2>
                  <button onClick={() => setShowRequestForm(!showRequestForm)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1">
                    {showRequestForm ? '취소' : '+ 문의하기'}
                  </button>
                </div>
                {showRequestForm && (
                  <div className="space-y-3 mb-4 border-b dark:border-gray-600 pb-4">
                    <div>
                      <label className="text-sm font-medium dark:text-white">문의 유형</label>
                      <select value={requestCategory} onChange={(e) => { setRequestCategory(e.target.value); if (e.target.value !== '기타 문의') setRequestTitle(e.target.value) }} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white">
                        <option value="">선택해주세요</option>
                        <option value="커버 체험단 추가 요청">커버 체험단 추가 요청</option>
                        <option value="기타 문의">기타 문의</option>
                      </select>
                    </div>
                    {requestCategory === '기타 문의' && (
                      <div>
                        <label className="text-sm font-medium dark:text-white">제목</label>
                        <input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="문의 제목" />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium dark:text-white">내용</label>
                      <textarea value={requestContent} onChange={(e) => setRequestContent(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" rows={4} placeholder="문의 내용을 입력해주세요" />
                    </div>
                    <button onClick={handleSubmitRequest} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">문의 등록</button>
                  </div>
                )}
                {requests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">문의 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div key={req.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium dark:text-white">{req.title}</p>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                            {req.status === 'PENDING' ? '검토중' : '✅ 확인됨'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{req.content}</p>
                        {req.reply && (
                          <div className="mt-2 bg-blue-50 dark:bg-blue-900 rounded p-2">
                            <p className="text-xs text-blue-700 font-medium mb-1">💬 답장</p>
                            <p className="text-xs text-blue-600">{req.reply}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 */}
          <div id="tutorial-stats-tab" className={`${activeTab === 'stats' ? 'block' : 'hidden'} md:block`}>
            {/* 선택된 프로젝트 정보 */}
            {projectInfo && (
              <>
                {userRole === 'client' && projectInfo?.cover_video_count > 0 && (
                  <button onClick={() => router.push('/cover')} className="w-full text-xs border dark:border-gray-600 dark:text-gray-300 rounded px-3 py-2 text-gray-600 mb-3 flex items-center justify-center gap-1"><Music size={12} /> 커버 페이지</button>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3 h-full flex flex-col">
                    <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> 프로젝트 기간</p>
                    <p className="text-xs dark:text-gray-300">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}{projectInfo.start_time ? ` ${projectInfo.start_time}` : ''}</p>
                    <p className="text-xs dark:text-gray-300">종료일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}{projectInfo.end_time ? ` ${projectInfo.end_time}` : ''}</p>
                    <p className="text-xs dark:text-gray-300">진행일수: {projectInfo.start_date ? Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24)) + '일째' : '미정'}</p>
                    </div>
                    <div className="mt-auto">
                    {projectInfo.document_id && typeof window !== 'undefined' && (!(window as any).Capacitor?.isNativePlatform?.() || appVersion >= '1.2') && (
                      <button onClick={async (e) => {
                        e.preventDefault()
                        const btn = e.currentTarget
                        btn.textContent = '다운로드 중...'
                        btn.disabled = true
                        try {
                          // 서명 완료 여부 체크
                          const statusRes = await fetch(`/api/eformsign?action=status&document_id=${projectInfo.document_id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          })
                          const statusData = await statusRes.json()
                          if (statusData.status !== '003') {
                            showToast('계약서 서명 후 다운로드 가능해요.', 'info')
                            return
                          }
                          const fileName = `${projectInfo.artist_name || projectInfo.client_name}_${projectInfo.song_title}_계약서`
                          const res = await fetch(`/api/eformsign?action=download&document_id=${projectInfo.document_id}&file_name=${encodeURIComponent(fileName)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          })
                          
                          if (res.ok) {
                            if ((window as any).Capacitor?.isNativePlatform?.()) {
                              const { Browser } = await import('@capacitor/browser')
                              const pdfUrl = `https://app.doubleb.kr/api/eformsign?action=download&document_id=${projectInfo.document_id}&file_name=${encodeURIComponent(fileName)}`
                              await Browser.open({ url: pdfUrl })
                            } else {
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = fileName + '.pdf'
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                            }
                          } else {
                            showToast('아직 서명이 완료되지 않았어요.')
                          }
                        } finally {
                          btn.textContent = '계약서 다운로드'
                          btn.disabled = false
                        }
                      }} className="w-full mt-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors inline-flex items-center justify-center gap-1"><FileText size={14} /> 계약서 다운로드</button>
                    )}
                    </div>                  
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Package size={12} /> 프로젝트 정보</p>
                    <p className="text-xs dark:text-gray-300">의뢰인: {projectInfo.client_name ?? '-'}</p>
                    {projectInfo.artist_name && <p className="text-xs dark:text-gray-300">가수명: {projectInfo.artist_name}</p>}
                    {projectInfo.song_title && <p className="text-xs dark:text-gray-300">노래제목: {projectInfo.song_title}</p>}
                    <p className="text-xs dark:text-gray-300">상품: {projectInfo.product_content ?? '-'}</p>
                    <p className="text-xs dark:text-gray-300">요청 게시물: {projectInfo.required_posts ?? 1}개</p>
                    <p className="text-xs dark:text-gray-300">모집인원: {projectInfo.max_participants ?? '-'}명</p>
                    {projectInfo.monitoring_extension > 0 && <p className="text-xs dark:text-gray-300">모니터링 연장: {projectInfo.monitoring_extension}일</p>}
                    {projectInfo.refresh_interval && <p className="text-xs dark:text-gray-300">새로고침 주기: {projectInfo.refresh_interval}시간</p>}
                    {projectInfo.cover_video_count > 0 && <p className="text-xs dark:text-gray-300">커버영상: {projectInfo.cover_video_count}개</p>}
                  </div>
                </div>
                {projectInfo.requirements && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><ClipboardList size={12} /> 의뢰인 요청사항</p>
                    <p className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">{projectInfo.requirements}</p>
                  </div>
                )}
              </>
            )}

            {/* 결과보고서 다운로드 */}
            {projectInfo && projectInfo.status === 'COMPLETED' && (
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-2xl p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1"><BarChart2 size={16} /> 프로젝트 결과보고서</p>
                <button onClick={() => window.open(`/report?project_code=${projectInfo.project_code}`, '_blank')} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors">
                  결과보고서 받기
                </button>
              </div>
            )}

            {/* 총 통계 */}
            {posts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><BarChart2 size={16} /> 전체 통계</h2>
                <div className={`grid gap-3 ${topRanker ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">총 게시물</p>
                    <p className="text-lg font-bold text-blue-600">{posts.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">총 좋아요</p>
                    <p className="text-lg font-bold text-red-500">{totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">총 댓글</p>
                    <p className="text-lg font-bold text-green-600">{totalComments.toLocaleString()}</p>
                  </div>
                  {topRanker && (
                    <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Trophy size={12} /> 1등</p>
                      <p className="text-sm font-bold text-yellow-700">{topRanker.influencer_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">❤️ {topRanker.likes_count?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {dailyStats.length > 0 && (
                  <div className="mt-4 relative z-10">
                    <p className="text-sm font-medium mb-2 dark:text-white flex items-center gap-1"><TrendingUp size={16} /> 일별 변화 추이</p>
                    
                    {/* 인스타그램 */}
                    {dailyStats.some(d => d.ig_likes || d.ig_comments || d.ig_views || d.ig_audio) && (
                      <StatsChart data={dailyStats} platform="instagram" likesKey="ig_likes" commentsKey="ig_comments" viewsKey="ig_views" audioKey="ig_audio" />
                    )}

                    {/* 유튜브 */}
                    {dailyStats.some(d => d.yt_likes || d.yt_comments || d.yt_views || d.yt_audio) && (
                      <StatsChart data={dailyStats} platform="youtube" likesKey="yt_likes" commentsKey="yt_comments" viewsKey="yt_views" audioKey="yt_audio" />
                    )}

                    {/* 틱톡 */}
                    {dailyStats.some(d => d.tt_likes || d.tt_comments || d.tt_views || d.tt_audio) && (
                      <StatsChart data={dailyStats} platform="tiktok" likesKey="tt_likes" commentsKey="tt_comments" viewsKey="tt_views" audioKey="tt_audio" />
                    )}

                    <p className="text-xs text-gray-400 mt-1 text-center">※ 데이터는 선택하신 상품에 따라 1~12시간 간격으로 갱신됩니다</p>
                  </div>
                )}
              </div>
            )}

            {/* SNS별 통계 */}
            {posts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Share2 size={16} /> SNS별 통계</h2>
                <div className="space-y-2">
                  {snsList.map(({ label, posts: snsPosts, links: snsLinks, icon }) => (
                    <div key={label} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1 dark:text-white">{icon} {label}</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">게시물</p>
                          <p className="text-sm font-bold dark:text-white">{snsPosts.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label === '유튜브' ? '좋아요' : '하트'}</p>
                          <p className="text-sm font-bold text-red-500 dark:text-red-400">{(snsPosts.reduce((s, p) => s + (p.likes_count ?? 0), 0) + snsLinks.reduce((s, l) => s + (l.likes_count ?? 0), 0)).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">댓글</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">{(snsPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0) + snsLinks.reduce((s, l) => s + (l.comments_count ?? 0), 0)).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">총 음원사용</p>
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {label === '인스타그램' ? (igAudioCount !== null ? `${igAudioCount}개` : '-') : ''}
                            {label === '틱톡' ? (ttAudioCount !== null ? `${ttAudioCount}개` : '-') : ''}
                            {label === '유튜브' ? (ytAudioCount !== null ? `${ytAudioCount}개` : '-') : ''}
                          </p>                          
                          {label === '인스타그램' && projectInfo?.instagram_audio_id && (
                            <a href={`https://www.instagram.com/reels/audio/${projectInfo.instagram_audio_id}/`} target="_blank" className="text-xs text-pink-500 border border-pink-300 rounded-lg px-3 py-1.5 mt-2 block text-center">
                              재사용 현황
                            </a>
                          )}
                          {label === '틱톡' && projectInfo?.tiktok_audio_id && (
                            <a href={projectInfo.tiktok_audio_id} target="_blank" className="text-xs text-black dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-1.5 mt-2 block text-center">
                              재사용 현황
                            </a>
                          )}
                          {label === '유튜브' && projectInfo?.youtube_audio_id && (
                            <a href={`https://www.youtube.com/source/${projectInfo.youtube_audio_id}/shorts`} target="_blank" className="text-xs text-red-500 border border-red-300 rounded-lg px-3 py-1.5 mt-2 block text-center">
                              재사용 현황
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">※ 게시물 수는 더블비뮤직 체험단 업로드 기준이며, 음원 사용량은 인스타그램/틱톡 전체 기준(체험단 외 일반 사용자 포함)입니다.</p>
                </div>
              </div>
            )}

            {/* 댓글 미션 현황 */}
            {commentMissionData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><MessageSquare size={16} /> 댓글 부스팅 현황</h2>
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 mb-1">누적 댓글 부스팅 현황</p>
                  <p className="text-3xl font-bold text-red-500">{commentMissionData.missions.length}건</p>
                </div>
                {commentMissionData.links?.filter((l: any) => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(l.platform)).length > 0 && (
                  <div className="space-y-2">
                    {commentMissionData.links
                      .filter((l: any) => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(l.platform))
                      .map((link: any) => {
                        const platformLabel = link.platform === 'youtube_shorts' ? '유튜브 숏츠' : link.platform === 'youtube_long' ? '유튜브 영상' : link.platform === 'youtube_lyric' ? '리릭영상' : '플레이리스트'
                        const count = commentMissionData.missions.filter((m: any) => m.video_id === link.video_id).length
                        return (
                          <div key={link.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{platformLabel}</p>
                              <p className="text-sm font-bold text-red-500 dark:text-red-400">{count}건</p>
                            </div>
                            <a href={link.url} target="_blank" className="text-xs text-blue-500 border border-blue-300 rounded px-2 py-1">링크 보기</a>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 커버 신청 목록 */}
            {coverRequests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Music size={16} /> 커버 신청</h2>
                <div className="space-y-2">
                  {coverRequests.map((req: any) => (
                    <div key={req.id} className="border border-purple-200 dark:border-purple-700 rounded-lg p-3 bg-purple-50 dark:bg-purple-900">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {req.participants?.instagram_profile_image || req.participants?.youtube_profile_image || req.participants?.tiktok_profile_image ? (
                            <img src={
                              req.participants?.cover_video_url?.includes('youtube') ? req.participants?.youtube_profile_image :
                              req.participants?.cover_video_url?.includes('instagram') ? req.participants?.instagram_profile_image :
                              req.participants?.cover_video_url?.includes('tiktok') ? req.participants?.tiktok_profile_image :
                              req.participants?.youtube_profile_image ?? req.participants?.instagram_profile_image ?? req.participants?.tiktok_profile_image
                            } className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">{req.participants?.name?.[0]}</div>
                          )}
                          <div>
                            <p className="text-sm font-medium dark:text-purple-200">{req.participants?.name}</p>
                            <p className="text-xs text-purple-600">이 체험단이 커버를 하고 싶어해요! 🎤</p>
                          </div>
                        </div>
                        <button onClick={() => router.push('/cover')} className="text-xs bg-purple-600 text-white rounded-lg px-3 py-1">확인하기</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 인스타/틱톡 링크 */}
            {projectLinks.filter(l => ['instagram', 'tiktok'].includes(l.platform)).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Link size={16} /> 관리자 SNS 링크</h2>
                <div className="space-y-2">
                  {projectLinks.filter(l => ['instagram', 'tiktok'].includes(l.platform)).map(link => (
                    <div key={link.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        {link.platform === 'instagram' ? (
                          <PlatformIcon platform="instagram" size={16} />
                        ) : (
                          <PlatformIcon platform="tiktok" size={16} />
                        )}
                        <p className="text-sm dark:text-white">{link.platform === 'instagram' ? '인스타그램' : '틱톡'}</p>
                      </div>
                      <a href={link.url} target="_blank" className="text-xs text-blue-500 border border-blue-300 rounded px-2 py-1">링크 보기 →</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 게시물 목록 */}
            {projectInfo && (
              <div ref={postsRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white">게시물 목록</h2>
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {[...posts]
                      .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
                      .slice(postPage * PAGE_SIZE, (postPage + 1) * PAGE_SIZE)
                      .map((post, index) => {
                        const rank = postPage * PAGE_SIZE + index + 1
                        const isEligible = (post.likes_count ?? 0) >= 1000
                        return (
                          <div key={post.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex gap-3">
                              <div className="shrink-0">
                                {(post.platform === 'instagram' ? post.participant?.instagram_profile_image :
                                  post.platform === 'youtube' ? post.participant?.youtube_profile_image :
                                  post.platform === 'tiktok' ? post.participant?.tiktok_profile_image : null) ? (
                                  <img src={post.platform === 'instagram' ? post.participant?.instagram_profile_image :
                                    post.platform === 'youtube' ? post.participant?.youtube_profile_image :
                                    post.participant?.tiktok_profile_image} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                    <PlatformIcon platform={post.platform} size={24} />
                                    
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {isEligible ? (
                                        <span className={`text-xs font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`}
                                        </span>
                                      ) : null}
                                      <p className="text-sm font-medium dark:text-white">{post.influencer_name}</p>
                                      {post.platform === 'instagram' && post.participant?.instagram_id && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">@{post.participant.instagram_id.replace('@','')} ({post.participant.instagram_followers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                      {post.platform === 'youtube' && post.participant?.youtube_id && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">@{post.participant.youtube_id.replace('@','')} ({post.participant.youtube_subscribers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                      {post.platform === 'tiktok' && post.participant?.tiktok_id && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">@{post.participant.tiktok_id.replace('@','')} ({post.participant.tiktok_followers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                                    {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p className="text-sm flex items-center justify-end gap-1 dark:text-gray-300">
                                      {post.platform === 'youtube' ? <ThumbsUp size={12} className="text-red-500" /> : <Heart size={12} className="text-red-500" />}
                                      {post.likes_count?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                      <MessageCircle size={12} />
                                      {post.comments_count?.toLocaleString()}
                                    </p>
                                    {post.views_count > 0 && (
                                      <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                        <PlayCircle size={12} />
                                        {post.views_count?.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">링크 보기 →</a>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {posts.length > PAGE_SIZE && (
                        <div className="flex justify-between items-center mt-3">
                          <button onClick={() => setPostPage(p => Math.max(0, p - 1))} disabled={postPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
                          <div className="flex gap-1">
                            {Array.from({length: Math.ceil(posts.length / PAGE_SIZE)}, (_, i) => (
                              <button key={i} onClick={() => setPostPage(i)} className={`text-xs px-2 py-1 border dark:border-gray-600 rounded ${postPage === i ? 'bg-blue-600 text-white border-blue-600' : 'dark:text-gray-300'}`}>{i + 1}</button>
                            ))}
                          </div>
                          <button onClick={() => setPostPage(p => Math.min(Math.ceil(posts.length / PAGE_SIZE) - 1, p + 1))} disabled={(postPage + 1) * PAGE_SIZE >= posts.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
                        </div>
                      )}
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 보고서 탭 */}
        <div id="tutorial-report-tab" className={`${activeTab === 'report' ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-4 dark:text-white flex items-center gap-1"><BarChart2 size={16} /> 결과보고서</h2>
            <div className="space-y-3">
              {myProjects?.map((p: any) => (
                <div key={p.project_code} className="border rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm dark:text-white">{p.artist_name} / {p.song_title}</p>
                      <p className="text-xs text-gray-400 mt-1">{p.start_date} ~ {p.end_date}</p>
                    </div>
                    {p.status === 'COMPLETED' ? (
                      <button onClick={() => window.open(`/report?project_code=${p.project_code}`, '_blank')} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg">
                        결과보고서 받기
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">프로젝트 종료 후 확인 가능합니다</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 프로젝트 신청 탭 */}
        <div className={`${activeTab === 'apply' ? 'block md:hidden' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <button onClick={() => setShowApplyModal(true)} className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium">+ 프로젝트 신청</button>
          </div>
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-4 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      {userRole === 'admin' ? (
        <AdminBottomNav active="client" onClientClick={() => setActiveTab('project')} />
      ) : (
        <div id="tutorial-bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex md:hidden z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
          <button onClick={() => setActiveTab('project')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'project' ? 'text-blue-600' : 'text-gray-400'}`}>
            <LayoutGrid size={20} className="mb-0.5" />프로젝트
          </button>
          <button id="tutorial-stats-btn" onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-400'}`}>
            <BarChart2 size={20} className="mb-0.5" />현황
          </button>
          <button id="tutorial-apply-btn" onClick={() => setActiveTab('apply')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'apply' ? 'text-blue-600' : 'text-gray-400'}`}>
            <FileText size={20} className="mb-0.5" />신청
          </button>
          <button id="tutorial-report-btn" onClick={() => router.push('/client-report')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'report' ? 'text-blue-600' : 'text-gray-400'}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>보고서
          </button>
          <button onClick={() => router.push('/client-mypage')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
            <User size={20} className="mb-0.5" />마이페이지
          </button>
        </div>
      )}
    </div>
    <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
      {showTutorial && isClient && (
        <ClientTutorial onDone={() => {
          setShowTutorial(false)
          localStorage.setItem('clientTutorialDone', 'true')
        }} />
      )}
    </>
  )
}