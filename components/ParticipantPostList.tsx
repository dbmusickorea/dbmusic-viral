'use client'
import React from 'react'

type Props = {
  displayPosts: any[]
  instagramPosts: any[]
  youtubePosts: any[]
  tiktokPosts: any[]
  showPosts: boolean
  setShowPosts: (v: boolean) => void
  postFilter: string
  setPostFilter: (v: 'current' | 'all') => void
  setParticipationFilter: (v: 'current' | 'all') => void
  setSelectedParticipation: (v: any) => void
  setShowParticipation: (v: boolean) => void
  myPostPage: number
  setMyPostPage: (page: number | ((p: number) => number)) => void
  PAGE_SIZE: number
  level: number
  coverReward: number
  projectsMap: any
  isDeletingPost: boolean
  onDeletePost: (post: any) => void
  onUrlEdit: (post: any) => void
  statusBadge: (projectCode: string) => React.ReactNode
  getLevelAmount: (baseAmount: number, level: number) => number
}

export default function ParticipantPostList({ displayPosts, instagramPosts, youtubePosts, tiktokPosts, showPosts, setShowPosts, postFilter, setPostFilter, setParticipationFilter, setSelectedParticipation, setShowParticipation, myPostPage, setMyPostPage, PAGE_SIZE, level, coverReward, projectsMap, isDeletingPost, onDeletePost, onUrlEdit, statusBadge, getLevelAmount }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold">📊 나의 게시물 현황</h2>
        <button onClick={() => setShowPosts(!showPosts)} className="text-xs border rounded px-2 py-1">{showPosts ? '숨기기' : '금액 내역 보기'}</button>
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => { setPostFilter('current'); setParticipationFilter('current'); setSelectedParticipation(null); setShowParticipation(postFilter !== 'current' || !showPosts) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'current' ? 'bg-blue-600 text-white' : 'border'}`}>진행 프로젝트</button>
        <button onClick={() => { setPostFilter('all'); setParticipationFilter('all'); setSelectedParticipation(null); setShowParticipation(postFilter !== 'all' || !showPosts) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'all' ? 'bg-blue-600 text-white' : 'border'}`}>전체 내역</button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-3 col-span-3">
          <p className="text-xs text-gray-500">총 게시물</p>
          <p className="text-xl font-bold text-blue-600">{displayPosts.length}개</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">인스타그램</p>
          <p className="text-lg font-bold">{instagramPosts.length}개</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">유튜브</p>
          <p className="text-lg font-bold">{youtubePosts.length}개</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">틱톡</p>
          <p className="text-lg font-bold">{tiktokPosts.length}개</p>
        </div>
      </div>
      {showPosts && (
        <div className="space-y-2">
          {displayPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">게시물이 없습니다.</p>
          ) : (
            <>
              {displayPosts.slice(myPostPage * PAGE_SIZE, (myPostPage + 1) * PAGE_SIZE).map((post) => {
                const baseAmount = projectsMap[post.project_code?.toUpperCase()]?.reward_per_post ?? 0
                const myAmount = getLevelAmount(baseAmount, level)
                return (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                          {statusBadge(post.project_code)}
                        </div>
                        <p className="text-xs text-gray-400">
                          {projectsMap[post.project_code?.toUpperCase()]?.artist_name
                            ? `${projectsMap[post.project_code?.toUpperCase()].artist_name} / ${projectsMap[post.project_code?.toUpperCase()]?.song_title ?? ''}`
                            : post.project_code}
                        </p>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500">링크 보기 →</a>
                        <button onClick={() => onUrlEdit(post)} className="text-xs text-orange-500 mt-1 block">URL 수정</button>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-medium text-blue-600">{myAmount.toLocaleString()}P</p>
                        <p className="text-xs text-gray-400">기본 {baseAmount.toLocaleString()}P</p>
                        {post.is_cover && (
                          <p className="text-xs text-purple-600 font-medium">🎵 커버 +{coverReward.toLocaleString()}P</p>
                        )}
                        <p className="text-xs text-gray-500">❤️ {post.likes_count?.toLocaleString()}</p>
                        <button disabled={isDeletingPost} onClick={() => onDeletePost(post)} className="text-xs text-red-400 mt-1">삭제</button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {displayPosts.length > PAGE_SIZE && (
                <div className="flex justify-between items-center mt-3">
                  <button onClick={() => setMyPostPage(p => Math.max(0, p - 1))} disabled={myPostPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                  <div className="flex gap-1">
                    {Array.from({length: Math.ceil(displayPosts.length / PAGE_SIZE)}, (_, i) => (
                      <button key={i} onClick={() => setMyPostPage(i)} className={`text-xs px-2 py-1 border rounded ${myPostPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button onClick={() => setMyPostPage(p => Math.min(Math.ceil(displayPosts.length / PAGE_SIZE) - 1, p + 1))} disabled={(myPostPage + 1) * PAGE_SIZE >= displayPosts.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
