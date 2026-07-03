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
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [filter, setFilter] = useState('active')
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')

    if (role === 'client' && parsed.client_id) {
      fetchMyProjects(parsed.client_id)
    }
  }, [])

  const fetchMyProjects = async (clientId: string) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setMyProjects(data ?? [])

    // 진행중 프로젝트 자동 선택
    const active = data?.find(p => p.status === 'ONGOING')
    if (active) {
      setProjectInfo(active)
      setClientCode(active.project_code)
      fetchPosts(active.project_code)
    }
  }

  const fetchPosts = async (code: string) => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .ilike('project_code', code)
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  const fetchData = async (code: string, filterType: string) => {
    if (!code) return
    let projectQuery = supabase.from('projects').select('*').ilike('project_code', code)
    if (filterType === 'active') projectQuery = projectQuery.eq('status', 'ONGOING')
    if (filterType === 'past') projectQuery = projectQuery.eq('status', 'COMPLETED')
    const { data: projectData } = await projectQuery.maybeSingle()
    setProjectInfo(projectData)
    fetchPosts(code)
  }

  const handleSelectProject = (project: any) => {
    setProjectInfo(project)
    setClientCode(project.project_code)
    fetchPosts(project.project_code)
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

        {/* 의뢰인 - 내 프로젝트 목록 */}
        {isClient && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="text-sm font-medium mb-3">
              안녕하세요, <span className="text-blue-600 font-bold">{userInfo?.name}</span>님!
            </p>
            {myProjects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">진행중인 프로젝트가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {myProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={`border rounded-lg p-3 cursor-pointer ${projectInfo?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
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

        {/* 관리자 - 코드 입력 */}
        {!isClient && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <label className="text-sm font-medium">프로젝트 코드 검색</label>
            <input
              value={clientCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
              placeholder="프로젝트 코드 입력 (예: A_1)"
            />
          </div>
        )}

        {/* 필터 */}
        {!isClient && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
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
        )}

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
        {projectInfo && (
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
        )}
      </div>
    </div>
  )
}