'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react' 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [dailyStats, setDailyStats] = useState<any[]>([])
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [myProjectPage, setMyProjectPage] = useState(0)
  const [allProjectPage, setAllProjectPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left')
  const [postPage, setPostPage] = useState(0)
  const [topRanker, setTopRanker] = useState<any>(null)
  const [igAudioCount, setIgAudioCount] = useState<number | null>(null)
  const [ttAudioCount, setTtAudioCount] = useState<number | null>(null)
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
      fetchPosts(active[0].project_code)
      fetchCommentMissionData(active[0].project_code)
      fetchDailyStats(active[0].project_code)
    }
  }

  const fetchPosts = async (code: string) => {
    const res = await fetch(`/api/posts?project_code=${code}`)
    const data = await res.json()
    setPosts(data ?? [])
    
    const eligible = data?.filter((p: any) => p.likes_count >= 1000)
      ?.sort((a: any, b: any) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    setTopRanker(eligible?.[0] ?? null)
  }

  const fetchCommentMissionData = async (code: string) => {
    const [videosRes, missionsRes] = await Promise.all([
      fetch(`/api/project_videos?project_code=${code}`),
      fetch(`/api/comment_missions?project_code=${code}&status=APPROVED`)
    ])
    const videos = await videosRes.json()
    const missions = await missionsRes.json()
    if (videos) {
      setCommentMissionData({
        videos,
        missions: missions ?? []
      })
    } else {
      setCommentMissionData(null)
    }
  }

  const handleSelectProject = (project: any) => {
    setProjectInfo(project)
    setClientCode(project.project_code)
    setIgAudioCount(null)
    setTtAudioCount(null)
    fetchPosts(project.project_code)
    fetchCommentMissionData(project.project_code)
    fetchDailyStats(project.project_code)
    setActiveTab('right')
    setPostPage(0)
    setTimeout(() => postsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
    if (project.instagram_audio_id) {
      setIgAudioCount(project.instagram_audio_count ?? null)
    }
    if (project.tiktok_audio_id) {
      setTtAudioCount(project.tiktok_audio_count ?? null)
    }
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

  const loadMyInfo = () => {
    setMyName(userInfo?.name ?? '')
    setMyCompany(userInfo?.company ?? '')
    setMyArtist(userInfo?.artist ?? '')
    setMyPhone(userInfo?.phone ?? '')
    setMyMobile(userInfo?.mobile ?? '')
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

  const fetchDailyStats = async (projectCode: string) => {
    const res = await fetch(`/api/post_stats_history?project_code=${projectCode}`)
    const data = await res.json()
    if (data && data.length > 0) {
      const dates = [...new Set(data.map((h: any) => h.recorded_at.includes('_') ? h.recorded_at.split('_')[0] : h.recorded_at))].sort()
      const stats = dates.map(date => {
        const dayData = data.filter((h: any) => h.recorded_at === date || h.recorded_at.startsWith(date + '_'))
        return {
          date,
          likes: Math.max(...dayData.map((h: any) => h.likes_count ?? 0)),
          comments: Math.max(...dayData.map((h: any) => h.comments_count ?? 0))
        }
      })
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
            <div className="text-center py-1 text-sm text-blue-500">
              {isRefreshing ? '🔄 새로고침 중...' : '↓ 놓으면 새로고침'}
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">더블비뮤직 의뢰인</h1>
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
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
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
            </div>
          )}
        </div>

        {/* 모바일 탭 */}
        <div className="md:hidden flex mb-4 border-b">
          <button onClick={() => setActiveTab('left')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'left' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📋 프로젝트</button>
          <button onClick={() => setActiveTab('right')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'right' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📊 현황</button>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 컬럼 */}
          <div className={`${activeTab === 'left' ? 'block' : 'hidden'} md:block`}>
            {/* 의뢰인 - 내 프로젝트 목록 */}
            {isClient && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium">안녕하세요, <span className="text-blue-600 font-bold">{userInfo?.name}</span>님!</p>
                  <button onClick={() => { if (!showMyInfo) loadMyInfo(); setShowMyInfo(!showMyInfo) }} className={`text-xs rounded px-2 py-1 ${showMyInfo ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}>내 정보 보기</button>
                </div>

                {showMyInfo && (
                  <div className="border-t pt-4 mb-4 space-y-3">
                    <h3 className="font-bold text-sm">👤 내 정보 수정</h3>
                    {[
                      { label: '대표자명', value: myName, setter: setMyName },
                      { label: '소속사명', value: myCompany, setter: setMyCompany },
                      { label: '아티스트명', value: myArtist, setter: setMyArtist },
                      { label: '전화번호', value: myPhone, setter: setMyPhone },
                      { label: '휴대전화', value: myMobile, setter: setMyMobile },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
                        <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                    <div>
                      <label className="text-sm font-medium">기존 비밀번호</label>
                      <input type="password" value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="기존 비밀번호 (변경시만)" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">새 비밀번호</label>
                      <input type="password" value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="새 비밀번호 (변경시만)" />
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
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{project.client_name} / {project.song_title ?? project.product_content}</p>
                              <p className="text-xs text-gray-500">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                              {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {myProjects.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setMyProjectPage(p => Math.max(0, p - 1))} disabled={myProjectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <span className="text-xs text-gray-500">{myProjectPage + 1} / {Math.ceil(myProjects.length / PAGE_SIZE)}</span>
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
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{project.client_name} / {project.song_title ?? project.product_content}</p>
                              <p className="text-xs text-gray-400">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                              {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredProjects.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setAllProjectPage(p => Math.max(0, p - 1))} disabled={allProjectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <span className="text-xs text-gray-500">{allProjectPage + 1} / {Math.ceil(filteredProjects.length / PAGE_SIZE)}</span>
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
                      <label className="text-sm font-medium">제목</label>
                      <input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="프로젝트 문의 제목" />
                    </div>
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
                          <span className={`text-xs px-2 py-1 rounded-full ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                            {req.status === 'PENDING' ? '검토중' : '✅ 확인됨'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{req.content}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 */}
          <div className={`${activeTab === 'right' ? 'block' : 'hidden'} md:block`}>
            {/* 선택된 프로젝트 정보 */}
            {projectInfo && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl shadow p-3">
                  <p className="text-xs text-gray-500 mb-1">📅 프로젝트 기간</p>
                  <p className="text-xs">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                  <p className="text-xs">종료일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}</p>
                  <p className="text-xs">진행일수: {projectInfo.start_date ? Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24)) + '일째' : '미정'}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-3">
                  <p className="text-xs text-gray-500 mb-1">📦 프로젝트 정보</p>
                  <p className="text-xs">의뢰인: {projectInfo.client_name ?? '-'}</p>
                  {projectInfo.song_title && <p className="text-xs">노래제목: {projectInfo.song_title}</p>}
                  <p className="text-xs">상품: {projectInfo.product_content ?? '-'}</p>
                  <p className="text-xs">요청 게시물: {projectInfo.required_posts ?? 1}개</p>
                  <p className="text-xs">모집인원: {projectInfo.max_participants ?? '-'}명</p>
                  {projectInfo.monitoring_extension > 0 && <p className="text-xs">모니터링 연장: {projectInfo.monitoring_extension}일</p>}
                  {projectInfo.refresh_interval && <p className="text-xs">새로고침 주기: {projectInfo.refresh_interval}시간</p>}
                  {projectInfo.cover_video_count > 0 && <p className="text-xs">커버영상: {projectInfo.cover_video_count}개</p>}
                  {projectInfo.requirements && <p className="text-xs">요청사항: {projectInfo.requirements}</p>}
                </div>
              </div>
            )}

            {/* 결과보고서 다운로드 */}
            {projectInfo && projectInfo.status === 'COMPLETED' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">📊 프로젝트 결과보고서</p>
                <button onClick={() => window.open(`/api/report?project_code=${projectInfo.project_code}`, '_blank')} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">
                  📥 결과보고서 다운로드 (엑셀)
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
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">📈 일별 변화 추이</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="likes" stroke="#ef4444" name="좋아요" dot={false} />
                        <Line type="monotone" dataKey="comments" stroke="#22c55e" name="댓글" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-1 text-center">※ 데이터는 매일 낮 12시에 갱신됩니다</p>
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
                          <p className="text-xs text-gray-500">좋아요</p>
                          <p className="text-sm font-bold text-red-500">{snsPosts.reduce((s, p) => s + (p.likes_count ?? 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">댓글</p>
                          <p className="text-sm font-bold text-green-600">{snsPosts.reduce((s, p) => s + (p.comments_count ?? 0), 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">🎵 음원사용</p>
                          <p className="text-sm font-bold text-purple-600">
                            {label === '인스타그램' ? (igAudioCount !== null ? `${igAudioCount}개` : '-') : ''}
                            {label === '틱톡' ? (ttAudioCount !== null ? `${ttAudioCount}개` : '-') : ''}
                            {label === '유튜브' ? '준비중' : ''}
                          </p>
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
                  <p className="text-xs text-gray-400">/ {commentMissionData.videos.target_count ?? 300}건 목표</p>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>달성률</span>
                    <span>{Math.min(100, Math.round((commentMissionData.missions.length / (commentMissionData.videos.target_count ?? 300)) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-red-500 h-4 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((commentMissionData.missions.length / (commentMissionData.videos.target_count ?? 300)) * 100))}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {commentMissionData.videos.shorts_url_1 && (
                    <div className="flex justify-between items-center border rounded-lg p-2">
                      <p className="text-xs font-medium flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-3 h-3" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> 유튜브 숏츠 1</p>
                      <p className="text-sm font-bold text-red-500">{commentMissionData.missions.filter((m: any) => m.video_id === commentMissionData.videos.shorts_video_id_1).length}건</p>
                    </div>
                  )}
                  {commentMissionData.videos.shorts_url_2 && (
                    <div className="flex justify-between items-center border rounded-lg p-2">
                      <p className="text-xs font-medium flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-3 h-3" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> 유튜브 숏츠 2</p>
                      <p className="text-sm font-bold text-red-500">{commentMissionData.missions.filter((m: any) => m.video_id === commentMissionData.videos.shorts_video_id_2).length}건</p>
                    </div>
                  )}
                  {commentMissionData.videos.playlist_url && (
                    <div className="flex justify-between items-center border rounded-lg p-2">
                      <p className="text-xs font-medium">🎵 플레이리스트</p>
                      <p className="text-sm font-bold text-red-500">{commentMissionData.missions.filter((m: any) => m.video_id === commentMissionData.videos.playlist_video_id).length}건</p>
                    </div>
                  )}
                </div>
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
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  {isEligible ? (
                                    <span className={`text-xs font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">-</span>
                                  )}
                                  <p className="text-sm font-medium">{post.influencer_name}</p>
                                </div>
                                <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                                {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm">❤️ {post.likes_count?.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">💬 {post.comments_count?.toLocaleString()}</p>
                              </div>
                            </div>
                            <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">링크 보기 →</a>
                          </div>
                        )
                      })}
                      {posts.length > PAGE_SIZE && (
                        <div className="flex justify-between items-center mt-3">
                          <button onClick={() => setPostPage(p => Math.max(0, p - 1))} disabled={postPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                          <span className="text-xs text-gray-500">{postPage + 1} / {Math.ceil(posts.length / PAGE_SIZE)}</span>
                          <button onClick={() => setPostPage(p => Math.min(Math.ceil(posts.length / PAGE_SIZE) - 1, p + 1))} disabled={(postPage + 1) * PAGE_SIZE >= posts.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
        </div>
      </div>
    </div>
  )
}