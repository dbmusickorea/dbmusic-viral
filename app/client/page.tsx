'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react' 

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
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')
    fetchNotifications(String(parsed.id))

    if (role === 'client' && parsed.client_id) {
      fetchMyProjects(parsed.client_id)
      fetchRequests(parsed.client_id)
    } else if (role === 'admin') {
      fetchAllProjects()
    }
  }, [])

  const fetchRequests = async (clientId: string) => {
    const { data } = await supabase.from('client_requests').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setRequests(data ?? [])
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { alert('제목과 내용을 입력해주세요.'); return }
    const { error } = await supabase.from('client_requests').insert({
      client_id: userInfo?.client_id,
      client_name: userInfo?.name,
      client_mobile: userInfo?.mobile,
      title: requestTitle,
      content: requestContent,
      requested_posts: Number(requestedPosts)
    })
    if (error) { alert('등록 실패!'); return }
    alert('✅ 프로젝트 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    // 관리자에게 푸시 알림 발송
    const { data: adminTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'admin')
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
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setAllProjects(data ?? [])
  }

  const fetchMyProjects = async (clientId: string) => {
    const { data } = await supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setMyProjects(data ?? [])
    const active = data?.find(p => p.status === 'ONGOING')
    if (active) {
      setProjectInfo(active)
      setClientCode(active.project_code)
      fetchPosts(active.project_code)
      fetchCommentMissionData(active.project_code)
    }
  }

  const fetchPosts = async (code: string) => {
    const { data } = await supabase.from('posts').select('*').ilike('project_code', code).order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  const fetchCommentMissionData = async (code: string) => {
    const [videosRes, missionsRes] = await Promise.all([
      supabase.from('project_videos').select('*').eq('project_code', code).maybeSingle(),
      supabase.from('comment_missions').select('*').eq('project_code', code).eq('status', 'APPROVED')
    ])
    if (videosRes.data) {
      setCommentMissionData({
        videos: videosRes.data,
        missions: missionsRes.data ?? []
      })
    } else {
      setCommentMissionData(null)
    }
  }

  const handleSelectProject = (project: any) => {
    setProjectInfo(project)
    setClientCode(project.project_code)
    fetchPosts(project.project_code)
    fetchCommentMissionData(project.project_code)
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
    const { error } = await supabase.from('users').update(updateData).eq('id', userInfo?.id)
    if (error) { alert('수정 실패!'); return }
    const updated = { ...userInfo, name: myName, company: myCompany, artist: myArtist, phone: myPhone, mobile: myMobile }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    alert('정보 수정 완료!')
    setShowMyInfo(false)
    setMyPassword('')
    setMyCurrentPassword('')
  }

  const fetchNotifications = async (id: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setUnreadCount(data?.filter(n => !n.is_read).length ?? 0)
  }

  const markAllRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', id).eq('is_read', false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0)

  const instagramPosts = posts.filter(p => p.platform === 'instagram')
  const youtubePosts = posts.filter(p => p.platform === 'youtube')
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok')

  const snsList = [
    { label: '인스타그램', posts: instagramPosts, emoji: '📸' },
    { label: '유튜브', posts: youtubePosts, emoji: '🎬' },
    { label: '틱톡', posts: tiktokPosts, emoji: '🎵' },
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">더블비뮤직 의뢰인</h1>
            <div className="flex items-center gap-2">
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

        {showNotifications && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">알림 내역</h2>
              <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-500 border rounded px-2 py-1">닫기</button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">알림이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`py-2 border-b border-gray-100 ${!n.is_read ? 'bg-blue-50' : ''}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {projectInfo && isClient && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-4">
            <p className="text-sm font-medium text-yellow-800">📝 요청 게시물 수: {projectInfo.required_posts ?? 1}개</p>
            {projectInfo.refresh_interval && (
              <p className="text-sm font-medium text-yellow-800 mt-1">🔄 새로고침 주기: {projectInfo.refresh_interval}시간마다</p>
            )}
          </div>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 컬럼 */}
          <div>
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
                      await supabase.from('users').delete().eq('id', userInfo?.id)
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
                  <div className="space-y-2">
                    {myProjects.map((project) => (
                      <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{project.product_content}</p>
                            <p className="text-xs text-gray-500">{project.project_code} · {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredProjects.map((project) => (
                      <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{project.project_code}</p>
                            <p className="text-xs text-gray-500">{project.client_name} · {project.product_content}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
                          <span className={`text-xs px-2 py-1 rounded-full ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status === 'PENDING' ? '검토중' : req.status === 'APPROVED' ? '승인' : '거절'}
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
          <div>
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
                  <p className="text-xs">상품: {projectInfo.product_content ?? '-'}</p>
                  <p className="text-xs">요청: {projectInfo.requirements ?? '-'}</p>
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
                <div className="grid grid-cols-3 gap-3">
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
                </div>
              </div>
            )}

            {/* SNS별 통계 */}
            {posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">📱 SNS별 통계</h2>
                <div className="space-y-2">
                  {snsList.map(({ label, posts: snsPosts, emoji }) => (
                    <div key={label} className="border rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">{emoji} {label}</p>
                      <div className="grid grid-cols-3 gap-2">
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
                      </div>
                    </div>
                  ))}
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
                      <p className="text-xs font-medium">🎬 유튜브 쇼츠 1</p>
                      <p className="text-sm font-bold text-red-500">{commentMissionData.missions.filter((m: any) => m.video_id === commentMissionData.videos.shorts_video_id_1).length}건</p>
                    </div>
                  )}
                  {commentMissionData.videos.shorts_url_2 && (
                    <div className="flex justify-between items-center border rounded-lg p-2">
                      <p className="text-xs font-medium">🎬 유튜브 쇼츠 2</p>
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
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">게시물 목록</h2>
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{post.influencer_name}</p>
                            <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">❤️ {post.likes_count?.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">💬 {post.comments_count?.toLocaleString()}</p>
                          </div>
                        </div>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">링크 보기 →</a>
                      </div>
                    ))}
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