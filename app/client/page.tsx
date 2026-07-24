'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react' 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Eye, EyeOff } from 'lucide-react'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { Heart, ThumbsUp, MessageCircle, PlayCircle } from 'lucide-react'

export default function Page3() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [clientCode, setClientCode] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('desc')
  const [commentMissionData, setCommentMissionData] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestContent, setRequestContent] = useState('')
  const [requestedPosts, setRequestedPosts] = useState('1')
  const [showMyInfo, setShowMyInfo] = useState(false)
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
  const [activeTab, setActiveTab] = useState<'project' | 'stats'>('project')
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

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
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
    loadData()
  }, [])



  const fetchRequests = async (clientId: string) => {
    const res = await fetch(`/api/client_requests?client_id=${clientId}`)
    const data = await res.json()
    setRequests(data ?? [])
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { alert('제목과 내용을 입력해주세요.'); return }
    const res = await fetch('/api/client_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: userInfo?.client_id,
        client_name: userInfo?.name,
        client_mobile: userInfo?.mobile,
        title: requestTitle,
        content: requestContent,
        requested_posts: Number(requestedPosts)
      })
    })
    if (!res.ok) { alert('등록 실패!'); return }
    alert('✅ 프로젝트 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    // 관리자에게 푸시 알림 발송
    const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
    const adminTokens = await adminTokensRes.json()
    if (adminTokens && adminTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📋 새 프로젝트 문의',
          body: `${userInfo?.name}님이 문의를 등록했어요: ${requestTitle}`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }
    fetchRequests(userInfo?.client_id)
  }

  const fetchAllProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setAllProjects(data ?? [])
  }

  const fetchMyProjects = async (clientId: string) => {
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
    const res = await fetch(`/api/posts?project_code=${code}`)
    const data = await res.json()
    
    if (data && data.length > 0) {
      const memberIds = [...new Set(data.map((p: any) => p.member_id))].join(',')
      const participantsRes = await fetch(`/api/participants?ids=${memberIds}`)
      const participantsData = await participantsRes.json()
      
      const merged = data.map((post: any) => ({
        ...post,
        participant: participantsData?.find((p: any) => p.id === post.member_id)
      }))
      setPosts(merged)
    } else {
      setPosts(data ?? [])
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

  const loadMyInfo = async () => {
    setMyName(userInfo?.name ?? '')
    setMyCompany(userInfo?.company ?? '')
    setMyArtist(userInfo?.artist ?? '')
    setMyPhone(userInfo?.phone ?? '')
    setMyMobile(userInfo?.mobile ?? '')
    // 아티스트 목록 불러오기
    if (userInfo?.client_id) {
      const res = await fetch(`/api/artists?client_id=${userInfo.client_id}`)
      const data = await res.json()
      setArtistList(data ?? [])
    }
    setShowMyInfo(true)
  }

  const handleUpdateMyInfo = async () => {
    // 비밀번호 변경 시 기존 비밀번호 확인
    if (myPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userInfo?.email,
        password: myCurrentPassword
      })
      if (authError) { alert('기존 비밀번호가 틀렸어요.'); return }
      await supabase.auth.updateUser({ password: myPassword })
    }
    const updateData: any = {
      name: myName, company: myCompany, artist: myArtist,
      phone: myPhone, mobile: myMobile
    }
    const res = await fetch(`/api/users?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { alert('수정 실패!'); return }
    const updated = { ...userInfo, name: myName, company: myCompany, artist: myArtist, phone: myPhone, mobile: myMobile }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    alert('정보 수정 완료!')
    setShowMyInfo(false)
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
    const coverRes = await fetch(`/api/posts?project_code=${projectCode}&is_cover=true`)
    const coverData = await coverRes.json()
    
    if (data && data.length > 0) {
      const dates = [...new Set(data.map((h: any) => h.recorded_at.includes('_') ? h.recorded_at.split('_')[0] : h.recorded_at))].sort()
      const stats: any[] = dates.map(date => {
        const dayData = data.filter((h: any) => h.recorded_at === date || h.recorded_at.startsWith(date + '_'))
        const igData = dayData.filter((h: any) => h.platform === 'instagram')
        const ytData = dayData.filter((h: any) => h.platform === 'youtube')
        const ttData = dayData.filter((h: any) => h.platform === 'tiktok')
        const coverCount = coverData?.filter((p: any) => p.created_at?.startsWith(date))?.length ?? 0
        return {
          date,
          ig_likes: igData.length > 0 ? Math.max(...igData.map((h: any) => h.likes_count ?? 0)) : 0,
          ig_comments: igData.length > 0 ? Math.max(...igData.map((h: any) => h.comments_count ?? 0)) : 0,
          ig_views: igData.length > 0 ? Math.max(...igData.map((h: any) => h.views_count ?? 0)) : 0,
          yt_likes: ytData.length > 0 ? Math.max(...ytData.map((h: any) => h.likes_count ?? 0)) : 0,
          yt_comments: ytData.length > 0 ? Math.max(...ytData.map((h: any) => h.comments_count ?? 0)) : 0,
          yt_views: ytData.length > 0 ? Math.max(...ytData.map((h: any) => h.views_count ?? 0)) : 0,
          tt_likes: ttData.length > 0 ? Math.max(...ttData.map((h: any) => h.likes_count ?? 0)) : 0,
          tt_comments: ttData.length > 0 ? Math.max(...ttData.map((h: any) => h.comments_count ?? 0)) : 0,
          tt_views: ttData.length > 0 ? Math.max(...ttData.map((h: any) => h.views_count ?? 0)) : 0,
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

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0)

  const instagramPosts = posts.filter(p => p.platform === 'instagram')
  const youtubePosts = posts.filter(p => p.platform === 'youtube')
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok')

  const snsList = [
    { label: '인스타그램', posts: instagramPosts, icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
    { label: '유튜브', posts: youtubePosts, icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
    { label: '틱톡', posts: tiktokPosts, icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
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
      {/* 사이드바 오버레이 */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="bg-white w-64 h-full shadow-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">더블비뮤직</h2>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400">✕</button>
            </div>
            <div className="space-y-2 flex-1">
              <button onClick={() => { setActiveTab('project'); setShowSidebar(false) }} className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium ${activeTab === 'project' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>📋 프로젝트</button>
              <button onClick={() => { setActiveTab('stats'); setShowSidebar(false) }} className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium ${activeTab === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>📊 현황</button>
              <button onClick={() => { router.push('/client-mypage'); setShowSidebar(false) }} className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-gray-600">👤 마이페이지</button>
            </div>
            <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setShowSidebar(false)} />
        </div>
      )}
      <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
              {isRefreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
              ) : (
                <><ArrowDown size={14} /> 놓으면 새로고침</>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <p className="text-xs text-gray-500">안녕하세요</p>
                <h1 className="text-lg font-bold">{userInfo?.name}님 👋</h1>
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
                  <div className="bg-white rounded-2xl shadow-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold">알림 내역</h2>
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
                          <div key={n.id} className={`py-2 border-b border-gray-100 flex justify-between items-start ${!n.is_read ? 'bg-blue-50' : ''}`}>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{n.title}</p>
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
          {userRole === 'admin' && (
            <div className="flex gap-1">
              <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
              <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
              <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
              <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
              <button onClick={() => router.push('/cover')} className="flex-1 text-xs border rounded py-2 text-center">커버</button>
            </div>
          )}
          {userRole === 'client' && projectInfo?.cover_video_count > 0 && (
            <div className="flex gap-1 mt-2">
              <button onClick={() => router.push('/cover')} className="flex-1 text-xs border rounded py-2 text-center">커버 페이지</button>
            </div>
          )}
        </div>


        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 컬럼 */}
          <div className={`${activeTab === 'project' ? 'block' : 'hidden'} md:block`}>
            {/* 의뢰인 - 내 프로젝트 목록 */}
            {isClient && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium">안녕하세요, <span className="text-blue-600 font-bold">{userInfo?.name}</span>님!</p>
                  <button onClick={() => { 
                    if (!showMyInfo) loadMyInfo(); 
                    setShowMyInfo(!showMyInfo)
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
                  }} className={`text-xs rounded px-2 py-1 ${showMyInfo ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}>내 정보 보기</button>
                </div>

                {showMyInfo && (
                  <div className="border-t pt-4 mb-4 space-y-3">
                    <h3 className="font-bold text-sm">👤 내 정보 수정</h3>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">로그인 아이디 (이메일)</p>
                      <p className="text-sm font-medium">{userInfo?.email ?? '-'}</p>
                    </div>
                    {[
                      { label: '대표자명', value: myName, setter: setMyName },
                      { label: '소속사명', value: myCompany, setter: setMyCompany },                      
                      { label: '휴대전화', value: myMobile, setter: setMyMobile },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
                        <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                    {/* 아티스트 목록 */}
                    <div>
                      <label className="text-sm font-medium">아티스트 목록</label>
                      <div className="space-y-2 mt-1">
                        {artistList.map((a) => (
                          <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-sm">{a.artist_name}</span>
                            <button onClick={async () => {
                              await fetch(`/api/artists?id=${a.id}`, { method: 'DELETE' })
                              const res = await fetch(`/api/artists?client_id=${userInfo.client_id}`)
                              setArtistList(await res.json())
                            }} className="text-xs text-red-400">삭제</button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="아티스트명 입력" />
                          <button onClick={async () => {
                            if (!newArtistName) return
                            await fetch('/api/artists', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ client_id: userInfo.client_id, artist_name: newArtistName })
                            })
                            setNewArtistName('')
                            const res = await fetch(`/api/artists?client_id=${userInfo.client_id}`)
                            setArtistList(await res.json())
                          }} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">기존 비밀번호</label>
                      <div className="relative mt-1">
                        <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="기존 비밀번호 (변경시만)" />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">새 비밀번호</label>
                      <div className="relative mt-1">
                        <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="새 비밀번호 (변경시만)" />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateMyInfo} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정하기</button>
                      <button onClick={() => setShowMyInfo(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                    </div>
                    <button onClick={async () => {
                      if (!confirm('정말 계정을 삭제하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) return
                      await fetch(`/api/users?id=${userInfo?.id}`, { method: 'DELETE' })
                      await supabase.auth.signOut()
                      localStorage.removeItem('userInfo')
                      localStorage.removeItem('userRole')
                      alert('계정이 삭제됐습니다.')
                      router.push('/')
                    }} className="w-full bg-red-500 text-white rounded-lg py-2 text-sm font-medium">계정 삭제</button>
                  </div>
                )}

                {myProjects.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">프로젝트가 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {myProjects.slice(myProjectPage * PAGE_SIZE, (myProjectPage + 1) * PAGE_SIZE).map((project) => (
                        <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {project.cover_image_url && (
                                <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                                <p className="text-xs text-gray-500">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
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
                        <button onClick={() => setMyProjectPage(p => Math.max(0, p - 1))} disabled={myProjectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(myProjects.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setMyProjectPage(i)} className={`text-xs px-2 py-1 border rounded ${myProjectPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setMyProjectPage(p => Math.min(Math.ceil(myProjects.length / PAGE_SIZE) - 1, p + 1))} disabled={(myProjectPage + 1) * PAGE_SIZE >= myProjects.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 관리자 - 프로젝트 목록 */}
            {!isClient && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">프로젝트 목록</h2>
                <input value={clientCode} onChange={(e) => handleCodeChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="프로젝트 코드 검색 (예: A_1)" />
                <div className="flex gap-2 mb-3">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-xs">
                    <option value="ALL">전체</option>
                    <option value="ONGOING">진행중</option>
                    <option value="PAUSED">대기중</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="flex-1 border rounded-lg px-2 py-1 text-xs">
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
                        <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {project.cover_image_url && (
                                <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-sm">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                                <p className="text-xs text-gray-400">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
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
                        <button onClick={() => setAllProjectPage(p => Math.max(0, p - 1))} disabled={allProjectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(filteredProjects.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setAllProjectPage(i)} className={`text-xs px-2 py-1 border rounded ${allProjectPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setAllProjectPage(p => Math.min(Math.ceil(filteredProjects.length / PAGE_SIZE) - 1, p + 1))} disabled={(allProjectPage + 1) * PAGE_SIZE >= filteredProjects.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 프로젝트 문의 게시판 */}
            {isClient && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">📋 프로젝트 문의</h2>
                  <button onClick={() => setShowRequestForm(!showRequestForm)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1">
                    {showRequestForm ? '취소' : '+ 문의하기'}
                  </button>
                </div>
                {showRequestForm && (
                  <div className="space-y-3 mb-4 border-b pb-4">
                    <div>
                      <label className="text-sm font-medium">문의 유형</label>
                      <select value={requestCategory} onChange={(e) => { setRequestCategory(e.target.value); if (e.target.value !== '기타 문의') setRequestTitle(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                        <option value="">선택해주세요</option>
                        <option value="커버 체험단 추가 요청">커버 체험단 추가 요청</option>
                        <option value="기타 문의">기타 문의</option>
                      </select>
                    </div>
                    {requestCategory === '기타 문의' && (
                      <div>
                        <label className="text-sm font-medium">제목</label>
                        <input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="문의 제목" />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">내용</label>
                      <textarea value={requestContent} onChange={(e) => setRequestContent(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={4} placeholder="문의 내용을 입력해주세요" />
                    </div>
                    <button onClick={handleSubmitRequest} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">문의 등록</button>
                  </div>
                )}
                {requests.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">문의 내역이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div key={req.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{req.title}</p>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                            {req.status === 'PENDING' ? '검토중' : '✅ 확인됨'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{req.content}</p>
                        {req.reply && (
                          <div className="mt-2 bg-blue-50 rounded p-2">
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
          <div className={`${activeTab === 'stats' ? 'block' : 'hidden'} md:block`}>
            {/* 선택된 프로젝트 정보 */}
            {projectInfo && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-2xl shadow p-3 h-full flex flex-col">
                    <div>
                    <p className="text-xs text-gray-500 mb-1">📅 프로젝트 기간</p>
                    <p className="text-xs">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}{projectInfo.start_time ? ` ${projectInfo.start_time}` : ''}</p>
                    <p className="text-xs">종료일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}{projectInfo.end_time ? ` ${projectInfo.end_time}` : ''}</p>
                    <p className="text-xs">진행일수: {projectInfo.start_date ? Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24)) + '일째' : '미정'}</p>
                    </div>
                    <div className="mt-auto">
                    {projectInfo.document_id && typeof window !== 'undefined' && !(window as any).Capacitor && (
                      <button onClick={async (e) => {
                        e.preventDefault()
                        const btn = e.currentTarget
                        btn.textContent = '다운로드 중...'
                        btn.disabled = true
                        try {
                          const fileName = `${projectInfo.artist_name || projectInfo.client_name}_${projectInfo.song_title}_계약서`
                          const res = await fetch(`/api/eformsign?action=download&document_id=${projectInfo.document_id}&file_name=${encodeURIComponent(fileName)}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                          })
                          const data = await res.json()
                          if (data.dataUrl) {
                            const a = document.createElement('a')
                            a.href = data.dataUrl
                            a.download = fileName + '.pdf'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          } else {
                            alert('아직 서명이 완료되지 않았어요.')
                          }
                        } finally {
                          btn.textContent = '📄 계약서 다운로드'
                          btn.disabled = false
                        }
                      }} className="w-full mt-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors">📄 계약서 다운로드</button>
                    )}
                    </div>                  
                  </div>
                  <div className="bg-white rounded-2xl shadow p-3">
                    <p className="text-xs text-gray-500 mb-1">📦 프로젝트 정보</p>
                    <p className="text-xs">의뢰인: {projectInfo.client_name ?? '-'}</p>
                    {projectInfo.artist_name && <p className="text-xs">가수명: {projectInfo.artist_name}</p>}
                    {projectInfo.song_title && <p className="text-xs">노래제목: {projectInfo.song_title}</p>}
                    <p className="text-xs">상품: {projectInfo.product_content ?? '-'}</p>
                    <p className="text-xs">요청 게시물: {projectInfo.required_posts ?? 1}개</p>
                    <p className="text-xs">모집인원: {projectInfo.max_participants ?? '-'}명</p>
                    {projectInfo.monitoring_extension > 0 && <p className="text-xs">모니터링 연장: {projectInfo.monitoring_extension}일</p>}
                    {projectInfo.refresh_interval && <p className="text-xs">새로고침 주기: {projectInfo.refresh_interval}시간</p>}
                    {projectInfo.cover_video_count > 0 && <p className="text-xs">커버영상: {projectInfo.cover_video_count}개</p>}
                  </div>
                </div>
                {projectInfo.requirements && (
                  <div className="bg-white rounded-2xl shadow p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">📋 의뢰인 요청사항</p>
                    <p className="text-xs whitespace-pre-wrap text-gray-700">{projectInfo.requirements}</p>
                  </div>
                )}
              </>
            )}

            {/* 결과보고서 다운로드 */}
            {projectInfo && projectInfo.status === 'COMPLETED' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">📊 프로젝트 결과보고서</p>
                <button onClick={() => {
                  window.open(`/api/report?project_code=${projectInfo.project_code}`, '_blank')
                  alert('상세 결과 보고서 작성을 원하시는 경우 문의하기로 요청하시면 2~3일 이내 발송됩니다.')
                }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors">
                  📥 결과 요약 다운로드 (엑셀)
                </button>
              </div>
            )}

            {/* 총 통계 */}
            {posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">📊 전체 통계</h2>
                <div className={`grid gap-3 ${topRanker ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">총 게시물</p>
                    <p className="text-lg font-bold text-blue-600">{posts.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">총 좋아요</p>
                    <p className="text-lg font-bold text-red-500">{totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">총 댓글</p>
                    <p className="text-lg font-bold text-green-600">{totalComments.toLocaleString()}</p>
                  </div>
                  {topRanker && (
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">🏆 1등</p>
                      <p className="text-sm font-bold text-yellow-700">{topRanker.influencer_name}</p>
                      <p className="text-xs text-gray-500">❤️ {topRanker.likes_count?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {dailyStats.length > 0 && (
                  <div className="mt-4 relative z-10">
                    <p className="text-sm font-medium mb-2">📈 일별 변화 추이</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          wrapperStyle={{ zIndex: 9999 }}
                          isAnimationActive={false}
                          filterNull={false}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 9999 }}>
                                  <p style={{ marginBottom: '4px', fontWeight: 'bold', color: '#374151' }}>{label}</p>
                                  {payload.map((entry: any, i: number) => (
                                    <p key={i} style={{ color: entry.color, margin: '2px 0' }}>
                                      {entry.name}: {entry.value != null ? entry.value.toLocaleString() : '-'}
                                    </p>
                                  ))}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="left"
                          wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                          formatter={(value, entry: any) => (
                            <span style={{ color: entry.color, fontSize: '10px', marginRight: '8px' }}>{value}</span>
                          )}
                        />
                        <Line type="monotone" dataKey="ig_likes" stroke="#E1306C" name="인스타 하트" dot={false} />
                        <Line type="monotone" dataKey="ig_comments" stroke="#F77737" name="인스타 댓글" dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="ig_views" stroke="#FCAF45" name="인스타 조회수" dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="yt_likes" stroke="#CC0000" name="유튜브 좋아요" dot={false} />
                        <Line type="monotone" dataKey="yt_comments" stroke="#FF6B6B" name="유튜브 댓글" dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="yt_views" stroke="#FF9999" name="유튜브 조회수" dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="tt_likes" stroke="#00F2EA" name="틱톡 하트" dot={false} />
                        <Line type="monotone" dataKey="tt_comments" stroke="#008080" name="틱톡 댓글" dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="tt_views" stroke="#004D4D" name="틱톡 조회수" dot={false} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="ig_audio" stroke="#833AB4" name="인스타 음원사용" dot={true} connectNulls={false} strokeDasharray="2 2" />
                        <Line type="monotone" dataKey="tt_audio" stroke="#405DE6" name="틱톡 음원사용" dot={true} connectNulls={false} strokeDasharray="2 2" />
                        <Line type="monotone" dataKey="yt_audio" stroke="#FF0076" name="유튜브 음원사용" dot={true} connectNulls={false} strokeDasharray="2 2" />
                        <Line type="monotone" dataKey="cover_count" stroke="#9333ea" name="커버영상" dot={true} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-1 text-center">※ 데이터는 선택하신 상품에 따라 1~12시간 간격으로 갱신됩니다</p>
                  </div>
                )}
              </div>
            )}

            {/* SNS별 통계 */}
            {posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">📱 SNS별 통계</h2>
                <div className="space-y-2">
                  {snsList.map(({ label, posts: snsPosts, icon }) => (
                    <div key={label} className="border rounded-lg p-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">{icon} {label}</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">게시물</p>
                          <p className="text-sm font-bold">{snsPosts.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{label === '유튜브' ? '좋아요' : '하트'}</p>
                          <p className="text-sm font-bold text-red-500">{snsPosts.reduce((s, p) => s + (p.likes_count ?? 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">댓글</p>
                          <p className="text-sm font-bold text-green-600">{snsPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">총 음원사용</p>
                          <p className="text-sm font-bold text-purple-600">
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
                            <a href={projectInfo.tiktok_audio_id} target="_blank" className="text-xs text-black border border-gray-300 rounded-lg px-3 py-1.5 mt-2 block text-center">
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
                  <p className="text-xs text-gray-400 mt-2">※ 게시물 수는 더블비뮤직 체험단 업로드 기준이며, 음원 사용량은 인스타그램/틱톡 전체 기준(체험단 외 일반 사용자 포함)입니다.</p>
                </div>
              </div>
            )}

            {/* 댓글 미션 현황 */}
            {commentMissionData && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">💬 댓글 부스팅 현황</h2>
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 mb-1">누적 댓글 부스팅 현황</p>
                  <p className="text-3xl font-bold text-red-500">{commentMissionData.missions.length}건</p>
                </div>
                {commentMissionData.links?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {/* 유튜브 합산 */}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">유튜브</p>
                      <p className="text-sm font-bold text-red-500">
                        {commentMissionData.missions.filter((m: any) => 
                          commentMissionData.links
                            .filter((l: any) => ['youtube_shorts', 'youtube_long', 'playlist'].includes(l.platform))
                            .some((l: any) => l.video_id === m.video_id)
                        ).length}건
                      </p>
                    </div>
                    {/* 인스타 */}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">인스타</p>
                      <p className="text-sm font-bold text-pink-500">
                        {commentMissionData.missions.filter((m: any) =>
                          commentMissionData.links
                            .filter((l: any) => l.platform === 'instagram')
                            .some((l: any) => l.video_id === m.video_id)
                        ).length}건
                      </p>
                    </div>
                    {/* 틱톡 */}
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">틱톡</p>
                      <p className="text-sm font-bold text-black">
                        {commentMissionData.missions.filter((m: any) =>
                          commentMissionData.links
                            .filter((l: any) => l.platform === 'tiktok')
                            .some((l: any) => l.video_id === m.video_id)
                        ).length}건
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 게시물 목록 */}
            {projectInfo && (
              <div ref={postsRef} className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">게시물 목록</h2>
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
                          <div key={post.id} className="border rounded-lg p-3">
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
                                    {post.platform === 'instagram' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                                    {post.platform === 'youtube' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                                    {post.platform === 'tiktok' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>}
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
                                      <p className="text-sm font-medium">{post.influencer_name}</p>
                                      {post.platform === 'instagram' && post.participant?.instagram_id && (
                                        <span className="text-xs text-gray-500">@{post.participant.instagram_id.replace('@','')} ({post.participant.instagram_followers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                      {post.platform === 'youtube' && post.participant?.youtube_id && (
                                        <span className="text-xs text-gray-500">@{post.participant.youtube_id.replace('@','')} ({post.participant.youtube_subscribers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                      {post.platform === 'tiktok' && post.participant?.tiktok_id && (
                                        <span className="text-xs text-gray-500">@{post.participant.tiktok_id.replace('@','')} ({post.participant.tiktok_followers?.toLocaleString() ?? '-'}명)</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                                    {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <p className="text-sm flex items-center justify-end gap-1">
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
                          <button onClick={() => setPostPage(p => Math.max(0, p - 1))} disabled={postPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                          <div className="flex gap-1">
                            {Array.from({length: Math.ceil(posts.length / PAGE_SIZE)}, (_, i) => (
                              <button key={i} onClick={() => setPostPage(i)} className={`text-xs px-2 py-1 border rounded ${postPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                            ))}
                          </div>
                          <button onClick={() => setPostPage(p => Math.min(Math.ceil(posts.length / PAGE_SIZE) - 1, p + 1))} disabled={(postPage + 1) * PAGE_SIZE >= posts.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                        </div>
                      )}
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50"
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
        <button onClick={() => setActiveTab('project')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'project' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">📋</span>
          프로젝트
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === 'stats' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">📊</span>
          현황
        </button>
        <button onClick={() => router.push('/client-mypage')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">👤</span>
          마이페이지
        </button>
      </div>
      <div className="h-16 md:hidden" />
    </div>
    </>
  )
}