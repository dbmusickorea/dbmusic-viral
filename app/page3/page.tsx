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
  const [filter, setFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    setUserInfo(JSON.parse(info))
    setUserRole(role ?? '')
  }, [])

  const fetchData = async (code: string, filterType: string = filter) => {
    let projectQuery = supabase.from('projects').select('*')
    if (code) projectQuery = projectQuery.ilike('project_code', code)
    if (filterType === 'active') projectQuery = projectQuery.eq('status', 'ONGOING')
    if (filterType === 'past') projectQuery = projectQuery.eq('status', 'COMPLETED')
    const { data: projectData } = await projectQuery.maybeSingle()
    setProjectInfo(projectData)

    let postsQuery = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (code) postsQuery = postsQuery.ilike('project_code', code)
    const { data: postsData } = await postsQuery
    setPosts(postsData ?? [])
  }

  const handleCodeChange = (code: string) => {
    setClientCode(code)
    if (code) fetchData(code)
    else fetchData('')
  }

  const handleFilter = (type: string) => {
    setFilter(type)
    fetchData(clientCode, type)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const instagramLikes = posts.filter(p => p.platform === 'instagram').reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const youtubeLikes = posts.filter(p => p.platform === 'youtube').reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const tiktokLikes = posts.filter(p => p.platform === 'tiktok').reduce((sum, p) => sum + (p.likes_count ?? 0), 0)
  const facebookLikes = posts.filter(p => p.platform === 'facebook').reduce((sum, p) => sum + (p.likes_count ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">🎵 DBMUSIC 의뢰인</h1>
          <div className="flex gap-2">
            {userRole === 'admin' && (
              <>
                <button onClick={() => router.push('/page1')} className="text-xs border rounded px-2 py-1">프로젝트관리</button>
                <button onClick={() => router.push('/page2')} className="text-xs border rounded px-2 py-1">체험단</button>
                <button onClick={() => router.push('/page4')} className="text-xs border rounded px-2 py-1">회원관리</button>
                <button onClick={() => router.push('/page5')} className="text-xs border rounded px-2 py-1">정산</button>
              </>
            )}
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
        </div>

        {/* 인증 코드 + 필터 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <label className="text-sm font-medium">의뢰인 인증 코드</label>
          <input
            value={clientCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            placeholder="프로젝트 코드 입력 (예: A_1)"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => handleFilter('active')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${filter === 'active' ? 'bg-blue-600 text-white' : 'border'}`}>진행 프로젝트</button>
            <button onClick={() => handleFilter('past')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${filter === 'past' ? 'bg-blue-600 text-white' : 'border'}`}>지난 프로젝트</button>
          </div>
        </div>

        {/* 프로젝트 정보 */}
        {projectInfo && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl shadow p-4">
              <p className="text-xs text-gray-500 mb-1">📅 프로젝트 기간</p>
              <p className="text-sm">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
              <p className="text-sm">종료일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}</p>
              <p className="text-sm">진행일수: {projectInfo.start_date ? Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24)) + '일째' : '미정'}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <p className="text-xs text-gray-500 mb-1">📦 프로젝트 정보</p>
              <p className="text-sm">의뢰인: {projectInfo.client_name ?? '-'}</p>
              <p className="text-sm">상품내용: {projectInfo.product_content ?? '-'}</p>
              <p className="text-sm">요청사항: {projectInfo.requirements ?? '-'}</p>
            </div>
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">총 좋아요 수</p>
            <p className="text-xl font-bold text-blue-600">{totalLikes.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">총 게시물 수</p>
            <p className="text-xl font-bold text-blue-600">{posts.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">인스타그램</p>
            <p className="text-lg font-bold">{instagramLikes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{posts.filter(p => p.platform === 'instagram').length}게시물</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">유튜브</p>
            <p className="text-lg font-bold">{youtubeLikes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{posts.filter(p => p.platform === 'youtube').length}게시물</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">틱톡</p>
            <p className="text-lg font-bold">{tiktokLikes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{posts.filter(p => p.platform === 'tiktok').length}게시물</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500">페이스북</p>
            <p className="text-lg font-bold">{facebookLikes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{posts.filter(p => p.platform === 'facebook').length}게시물</p>
          </div>
        </div>

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
                  <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">{post.post_url}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}