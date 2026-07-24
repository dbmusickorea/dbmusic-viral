'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { RefreshCw, ArrowDown } from 'lucide-react'

export default function CoverPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [coverParticipants, setCoverParticipants] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [coverRequests, setCoverRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [coverPosts, setCoverPosts] = useState<any[]>([])
  const [coverAddApproved, setCoverAddApproved] = useState(false)
  const [coverRequestedIds, setCoverRequestedIds] = useState<number[]>([])

  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([^/?]+)/)
    if (igMatch) return `https://www.instagram.com/p/${igMatch[1]}/embed`
    const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
    if (ttMatch) return `https://www.tiktok.com/embed/${ttMatch[1]}`
    return url
  }

  const getCoverPlatform = (url: string) => {
    if (!url) return null
    if (url.includes('instagram.com')) return 'instagram'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('tiktok.com')) return 'tiktok'
    return null
  }

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')
    loadData(parsed, role ?? '')
  }, [])

  const loadData = async (user: any, role: string) => {
    const participantsRes = await fetch('/api/participants?cover_approved=true')
    const participants = await participantsRes.json()
    setCoverParticipants(participants ?? [])
    // 커버 게시물 불러오기
    const coverPostsRes = await fetch('/api/posts?is_cover=true')
    const coverPostsData = await coverPostsRes.json()
    setCoverPosts(Array.isArray(coverPostsData) ? coverPostsData : [])

    if (role === 'admin') {
      const projectsRes = await fetch('/api/projects?status=ONGOING,PENDING')
      const projects = await projectsRes.json()
      setProjects(projects ?? [])
    } else if (role === 'client') {
      const projectsRes = await fetch(`/api/projects?client_id=${user.client_id}`)
      const projects = await projectsRes.json()
      // 커버 옵션 선택한 프로젝트만
      const coverProjects = projects?.filter((p: any) => p.cover_video_count > 0) ?? []
      if (coverProjects.length === 0) {
        alert('커버 옵션을 선택한 프로젝트가 없어요.')
        router.push('/client')
        return
      }
      setProjects(coverProjects)
    }
    setIsLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData(userInfo, userRole)
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleSelectParticipant = async (participant: any) => {
    if (!selectedProject) { alert('먼저 프로젝트를 선택해주세요.'); return }
    
    // 미션 시작일 체크
    if (selectedProject.start_date && selectedProject.start_time) {
      const startDateTime = new Date(`${selectedProject.start_date}T${selectedProject.start_time}:00`)
      if (new Date() >= startDateTime) {
        alert('미션이 이미 시작됐어요. 미션 시작 전에만 커버 체험단을 선택할 수 있어요.')
        return
      }
    } else if (selectedProject.start_date && new Date() >= new Date(selectedProject.start_date)) {
      alert('미션이 이미 시작됐어요. 미션 시작 전에만 커버 체험단을 선택할 수 있어요.')
      return
    }
    
    // 이미 선택했는지 확인
    const existing = coverRequests.find(r => r.project_code === selectedProject.project_code && r.participant_id === participant.id)
    if (existing) { alert('이미 선택된 체험단이에요.'); return }

    const res = await fetch('/api/cover_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_code: selectedProject.project_code,
        client_id: userInfo.client_id,
        participant_id: participant.id,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    })
    
    if (res.ok) {
      // 체험단에게 푸시
      const tokensRes = await fetch(`/api/push_tokens?user_id=${String(participant.id)}`)
      const tokens = await tokensRes.json()
      if (tokens && tokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎵 커버영상 미션 선택됐어요!',
            body: `[${selectedProject.project_code}] 커버영상 미션에 선택됐어요. 승인/거절을 선택해주세요.`,
            tokens: tokens.map((t: any) => t.token),
            userIds: tokens.map((t: any) => t.user_id)
          })
        })
      }
      alert('선택 완료! 체험단에게 알림을 보냈어요.')
      loadCoverRequests(selectedProject.project_code)
    }
  }

  const loadCoverRequests = async (projectCode: string) => {
    const res = await fetch(`/api/cover_requests?project_code=${projectCode}`)
    const data = await res.json()
    setCoverRequests(data ?? [])

    // cover_requested 정보 가져오기
    const ppRes = await fetch(`/api/project_participants?project_code=${projectCode}`)
    const ppData = await ppRes.json()
    setCoverRequestedIds(ppData?.filter((p: any) => p.cover_requested).map((p: any) => p.member_id) ?? [])
    
    // 커버 추가 요청 승인 여부 확인
    const reqRes = await fetch(`/api/client_requests?client_id=${userInfo?.client_id}&project_code=${projectCode}`)
    const reqData = await reqRes.json()
    const approved = reqData?.some((r: any) => r.title === '커버 체험단 추가 요청' && r.status === 'APPROVED')
    setCoverAddApproved(approved)
  }
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
        if (pullStartY > 0 && e.touches[0].clientY - pullStartY > 60) {
          setIsPulling(true)
        }
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setPullStartY(0)
      }}
    >
      {(isPulling || isRefreshing) && (
        <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
          {isRefreshing ? (
            <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
          ) : (
            <><ArrowDown size={14} /> 놓으면 새로고침</>
          )}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">커버 페이지</h1>
          </div>
          <div className="flex gap-1 mb-2">
            {userRole === 'admin' && (
              <>
                <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
                <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
                <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
                <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
              </>
            )}
          </div>
        </div>

        {/* 의뢰인 안내 */}
        {userRole === 'client' && (
          <>
            <button onClick={() => router.push('/client')} className="w-full text-xs border rounded py-2 text-center mb-3">← 의뢰인 페이지로 돌아가기</button>
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-1">📢 커버영상 안내</p>
              <p className="text-xs text-blue-700">• 커버영상은 음원 발매 15일 이내에 업로드됩니다.</p>
              <p className="text-xs text-blue-700">• 미션 시작 전까지 커버 체험단을 선택할 수 있습니다.</p>
            </div>
          </>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 - 프로젝트 선택 */}
          <div>
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">프로젝트 선택</h2>
              <div className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} onClick={() => { setSelectedProject(p); loadCoverRequests(p.project_code) }}
                    className={`border rounded-lg p-3 cursor-pointer ${selectedProject?.id === p.id ? 'border-purple-500 bg-purple-50' : ''}`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {p.cover_image_url && (
                          <img src={p.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-base font-bold">{p.artist_name || p.client_name} / {p.song_title ?? p.product_content}</p>
                          <p className="text-xs text-gray-500 mt-1">{p.start_date ?? '미정'} ~ {p.end_date ?? '미정'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${p.status === 'ONGOING' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status === 'ONGOING' ? '진행중' : p.status === 'PENDING' ? '대기중' : '종료'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 - 커버 가능 체험단 */}
          <div>
            {selectedProject && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">🎤 커버 가능 체험단</h2>
                {userRole === 'admin' && selectedProject && (() => {
                  const daysSinceStart = selectedProject.start_date ? Math.floor((new Date().getTime() - new Date(selectedProject.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
                  const coverClosed = daysSinceStart >= 3 && !selectedProject.cover_deadline_extended
                  return coverClosed ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex justify-between items-center">
                      <p className="text-xs text-yellow-700">⚠️ 커버 신청 기간이 마감됐어요.</p>
                      <button onClick={async () => {
                        await fetch(`/api/projects?project_code=${selectedProject.project_code}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ cover_deadline_extended: true })
                        })
                        alert('커버 신청 기간이 연장됐어요!')
                        setSelectedProject({ ...selectedProject, cover_deadline_extended: true })
                      }} className="text-xs bg-yellow-500 text-white rounded px-2 py-1">연장하기</button>
                    </div>
                  ) : selectedProject.cover_deadline_extended ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-green-700">✅ 커버 신청 기간이 연장됐어요.</p>
                    </div>
                  ) : null
                })()}
                {coverParticipants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">승인된 커버가능 체험단이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {coverParticipants.map(p => {
                      const request = coverRequests.find(r => r.participant_id === p.id)
                      const coverPost = coverPosts.find(post => post.member_id === p.id && request?.project_code === post.project_code)
                      return (
                        <div key={p.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-3 flex-1 min-w-0">
                              {/* 프로필사진 */}
                              <div className="shrink-0">
                                {(() => {
                                  const platform = getCoverPlatform(p.cover_video_url)
                                  const img = platform === 'instagram' ? p.instagram_profile_image :
                                              platform === 'youtube' ? p.youtube_profile_image :
                                              platform === 'tiktok' ? p.tiktok_profile_image : null
                                  return img ? (
                                    <img src={img} className="w-12 h-12 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                      {platform === 'instagram' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                                      {platform === 'youtube' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                                      {platform === 'tiktok' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>}
                                    </div>
                                  )
                                })()}
                              </div>
                              {/* 정보 */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{p.name}</p>
                                {coverRequestedIds.includes(p.id) && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🎵 커버 희망</span>}
                                {(() => {
                                  const platform = getCoverPlatform(p.cover_video_url)
                                  if (platform === 'instagram' && p.instagram_id) return <p className="text-xs text-gray-500">@{p.instagram_id.replace('@','')} {p.instagram_followers > 0 && `(${p.instagram_followers.toLocaleString()}명)`}</p>
                                  if (platform === 'youtube' && p.youtube_id) return <p className="text-xs text-gray-500">@{p.youtube_id.replace('@','')} {p.youtube_subscribers > 0 && `(${p.youtube_subscribers.toLocaleString()}명)`}</p>
                                  if (platform === 'tiktok' && p.tiktok_id) return <p className="text-xs text-gray-500">@{p.tiktok_id.replace('@','')} {p.tiktok_followers > 0 && `(${p.tiktok_followers.toLocaleString()}명)`}</p>
                                  return null
                                })()}                                
                                <p className="text-xs text-gray-400">※ 팔로워수는 오차가 있을 수 있습니다.</p>
                                {p.cover_video_url && (
                                  <>
                                    <button onClick={() => setPreviewUrl(previewUrl === p.cover_video_url ? '' : p.cover_video_url)} className="text-xs text-blue-500">영상 보기 →</button>
                                    {previewUrl === p.cover_video_url && (
                                      <iframe src={getEmbedUrl(p.cover_video_url)} className="w-full mt-2 rounded-lg" style={{height: '200px'}} allowFullScreen />
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {userRole === 'client' && (
                              <div>
                                {!request ? (
                                  (() => {
                                    const daysSinceStart = Math.floor((new Date().getTime() - new Date(selectedProject?.start_date).getTime()) / (1000 * 60 * 60 * 24))
                                    if (selectedProject?.status === 'ONGOING' && !coverAddApproved && daysSinceStart >= 3) {
                                      return <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">선택 마감</span>
                                    }
                                    return <button onClick={() => handleSelectParticipant(p)} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full">선택</button>
                                  })()
                                ) : request.status === 'PENDING' ? (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기중</span>
                                ) : request.status === 'APPROVED' ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">승인됨</span>
                                ) : request.status === 'REJECTED' ? (
                                  request.rejected_count < 2 ? (
                                    <button onClick={() => handleSelectParticipant(p)} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full">재선택</button>
                                  ) : (
                                    <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full">거절됨</span>
                                  )
                                ) : null}
                              </div>
                            )}
                            {userRole === 'admin' && request && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                request.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                request.status === 'REJECTED' ? 'bg-red-100 text-red-500' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{request.status === 'APPROVED' ? '승인' : request.status === 'REJECTED' ? '거절' : '대기중'}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 재선택 2회 후 공개 모집 */}
            {userRole === 'client' && selectedProject && coverRequests.filter(r => r.rejected_count >= 2).length > 0 && (
              <div className="bg-orange-50 rounded-2xl p-4 mb-4">
                <p className="text-sm font-medium text-orange-700 mb-2">⚠️ 거절이 2회 발생했어요.</p>
                <button onClick={async () => {
                  const approvedParticipants = coverParticipants.filter(p => !coverRequests.find(r => r.participant_id === p.id))
                  if (approvedParticipants.length === 0) { alert('알림 받을 체험단이 없어요.'); return }
                  const ids = approvedParticipants.map(p => String(p.id))
                  const tokensRes = await fetch(`/api/push_tokens?user_ids=${ids.join(',')}`)
                  const tokens = await tokensRes.json()
                  if (tokens && tokens.length > 0) {
                    await fetch('/api/push', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: '🎵 커버영상 미션 모집!',
                        body: `[${selectedProject.project_code}] 커버영상 미션 참여자를 모집합니다!`,
                        tokens: tokens.map((t: any) => t.token),
                        userIds: tokens.map((t: any) => t.user_id)
                      })
                    })
                  }
                  alert('모집 푸시를 보냈어요!')
                }} className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium">
                  커버가능 체험단 전체에게 모집 푸시 보내기
                </button>
              </div>
            )}
            {/* 커버 대시보드 */}
            {selectedProject && coverRequests.filter(r => r.status === 'APPROVED').length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-1">📊 커버 대시보드</h2>
                <p className="text-xs text-gray-400 mb-3">
                  {selectedProject.start_date} ~ {selectedProject.end_date ? 
                    new Date(new Date(selectedProject.end_date).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                    : '미정'}
                </p>
                <div className="space-y-2">
                  {coverRequests.filter(r => r.status === 'APPROVED').map(r => {
                    const participant = coverParticipants.find(p => p.id === r.participant_id)
                    const coverPost = coverPosts.find(post => post.member_id === r.participant_id && post.project_code === r.project_code)
                    return (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{participant?.name ?? '-'}</p>
                            {coverPost && (
                              <>
                                <button onClick={() => setPreviewUrl(previewUrl === coverPost.post_url ? '' : coverPost.post_url)} className="text-xs text-blue-500">영상 보기 →</button>
                                {previewUrl === coverPost.post_url && (
                                  <iframe src={getEmbedUrl(coverPost.post_url)} className="w-full mt-2 rounded-lg" style={{height: '200px'}} allowFullScreen />
                                )}
                              </>
                            )}
                          </div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{coverPost ? '업로드완료' : '업로드전'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
        <button onClick={() => router.push('/client')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">🏢</span>의뢰인
        </button>
        <button onClick={() => router.push('/members')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">👤</span>회원관리
        </button>
        <button onClick={() => router.push('/settlement')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">💰</span>정산
        </button>
        <button onClick={() => router.push('/cover')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">🎵</span>커버
        </button>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  )
}