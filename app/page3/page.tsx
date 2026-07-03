'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page3() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [clientCode, setClientCode] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [filter, setFilter] = useState('active')
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')

    // 의뢰인이면 본인 project_code 자동 로드
    if (role === 'client' && parsed.project_code) {
      setClientCode(parsed.project_code)
      fetchData(parsed.project_code, 'active')
    }
  }, [])

  const fetchData = async (code: string, filterType: string) => {
    if (!code) return

    let projectQuery = supabase.from('projects').select('*').ilike('project_code', code)
    if (filterType === 'active') projectQuery = projectQuery.eq('status', 'ONGOING')
    if (filterType === 'past') projectQuery = projectQuery.eq('status', 'COMPLETED')
    const { data: projectData } = await projectQuery.maybeSingle()
    setProjectInfo(projectData)

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .ilike('project_code', code)
      .order('created_at', { ascending: false })
    setPosts(postsData ?? [])
  }

  const handleCodeChange = (code: string) => {
    setClientCode(code)
    if (code) fetchData(code, filter)
    else { setProjectInfo(null); setPosts([]) }
  }

  const handleFilter = (type: string) => {
    setFilter(type)
    if (clientCode) fetchData(clientCode, type)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0)

  const instagramPosts = posts.filter(p => p.platform === 'instagram')
  const youtubePosts = posts.filter(p => p.platform === 'youtube')
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok')
  const facebookPosts = posts.filter(p => p.platform === 'facebook')

  const snsList = [
    { label: '인스타그램', posts: instagramPosts, emoji: '📸' },
    { label: '유튜브', posts: youtubePosts, emoji: '🎬' },
    { label: '틱톡', posts: tiktokPosts, emoji: '🎵' },
    { label: '페이스북', posts: facebookPosts, emoji: '👥' },
  ]

  const isClient = userRole === 'client'

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">🎵 DBMUSIC 의뢰인</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-1">
              <button onClick={() => router.push('/page1')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
              <button onClick={() => router.push('/page2')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
              <button onClick={() => router.push('/page4')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
              <button onClick={() => router.push('/page5')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
            </div>
          )}
        </div>

        {/* 코드 입력 - 관리자만 */}
        {!isClient && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <label className="text-sm font-medium">의뢰인 인증 코드</label>
            <input
              value={clientCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="프로젝트 코드 입력 (예: A_1)"
            />
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          {isClient && (
            <p className="text-sm font-medium mb-3">
              안녕하세요, <span className="text-blue-600 font-bold">{userInfo?.name}</span>님의 프로젝트예요
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilter('active')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${filter === 'active' ? 'bg-blue-600 text-white' : 'border'}`}
            >
              진행 프로젝트
            </button>
            <button
              onClick={() => handleFilter('past')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${filter === 'past' ? 'bg-blue-600 text-white' : 'border'}`}
            >
              지난 프로젝트
            </button>
          </div>
        </div>

        {/* 프로젝트 없음 메시지 */}
        {clientCode && !projectInfo && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4 text-center">
            <p className="text-sm text-gray-400">
              {filter === 'active' ? '진행중인 프로젝트가 없습니다.' : '완료된 프로젝트가 없습니다.'}
            </p>
          </div>
        )}

        {/* 프로젝트 정보 */}
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

        {/* 게시물 목록 */}
        <div className="bg-white rounded-2xl shadow p-4">
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
      </div>
    </div>
  )
}