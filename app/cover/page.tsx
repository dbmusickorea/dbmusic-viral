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
                <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
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
                    <p className="text-sm font-medium">{p.client_name} / {p.song_title ?? p.product_content}</p>
                    <p className="text-xs text-gray-400">{p.project_code}</p>
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
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              {p.cover_video_url && (
                                <>
                                  <button onClick={() => setPreviewUrl(previewUrl === p.cover_video_url ? '' : p.cover_video_url)} className="text-xs text-blue-500">영상 보기 →</button>
                                  {previewUrl === p.cover_video_url && (
                                    <iframe src={getEmbedUrl(p.cover_video_url)} className="w-full mt-2 rounded-lg" style={{height: '200px'}} allowFullScreen />
                                  )}
                                </>
                              )}
                            </div>
                            {userRole === 'client' && (
                              <div>
                                {!request ? (
                                  <button onClick={() => handleSelectParticipant(p)} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full">선택</button>
                                ) : request.status === 'PENDING' ? (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기중</span>
                                ) : request.status === 'APPROVED' ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{coverPost ? '업로드완료' : '업로드전'}</span>
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
        className="fixed bottom-6 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50"
      >
        ↑
      </button>
    </div>
  )
}