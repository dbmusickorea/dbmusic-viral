'use client'
import { Heart, MessageCircle, PlayCircle, ThumbsUp, RefreshCw } from 'lucide-react'
import PlatformIcon from './PlatformIcon'
import { ClipboardList } from 'lucide-react'

type Props = {
  posts: any[]
  selectedParticipantId: number | null
  adminPostPage: number
  setAdminPostPage: (page: number | ((p: number) => number)) => void
  PAGE_SIZE: number
  updatingPostId: number | null
  isUpdatingLikes: boolean
  onUpdateAllLikes: () => void
  onUpdateSingleLike: (post: any) => void
  onConvertCover: (postId: number) => void
  onDeletePost: (post: any) => void
  onUrlEdit: (post: any) => void
}

export default function AdminPostList({ posts, selectedParticipantId, adminPostPage, setAdminPostPage, PAGE_SIZE, updatingPostId, isUpdatingLikes, onUpdateAllLikes, onUpdateSingleLike, onConvertCover, onDeletePost, onUrlEdit }: Props) {
  const filteredPosts = selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts
  const sortedPosts = [...filteredPosts].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
  const pagedPosts = sortedPosts.slice(adminPostPage * PAGE_SIZE, (adminPostPage + 1) * PAGE_SIZE)

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white flex items-center gap-1"><ClipboardList size={16} /> 게시물 목록 ({filteredPosts.length}개)</h2>
        {posts.length > 0 && (
          <button onClick={onUpdateAllLikes} disabled={isUpdatingLikes} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg disabled:bg-gray-400 cursor-pointer">
            {isUpdatingLikes ? '갱신 중...' : <><RefreshCw size={14} className="inline mr-1" />좋아요 갱신</>}
          </button>
        )}
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {pagedPosts.map((post, index) => {
              const rank = adminPostPage * PAGE_SIZE + index + 1
              const isEligible = (post.likes_count ?? 0) >= 1000
              return (
                <div key={post.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 min-w-0 flex-1">
                      {(post.platform === 'instagram' ? post.participant?.instagram_profile_image :
                        post.platform === 'youtube' ? post.participant?.youtube_profile_image :
                        post.participant?.tiktok_profile_image) ? (
                        <img src={post.platform === 'instagram' ? post.participant?.instagram_profile_image :
                          post.platform === 'youtube' ? post.participant?.youtube_profile_image :
                          post.participant?.tiktok_profile_image} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center shrink-0">
                          <PlatformIcon platform={post.platform} size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isEligible ? (
                            <span className={`text-xs font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`}
                            </span>
                          ) : null}
                          <p className="text-sm font-medium dark:text-white">{post.influencer_name}{post.is_cover && <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded ml-1">COVER</span>}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500 block overflow-hidden text-ellipsis whitespace-nowrap">링크 보기 →</a>
                        <button onClick={() => onUrlEdit(post)} className="text-xs text-orange-500 mt-1 block">URL 수정</button>
                        <p className="text-xs mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            {post.platform === 'youtube' ? <ThumbsUp size={12} className="text-red-500" /> : <Heart size={12} className="text-red-500" />}
                            {post.likes_count?.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <MessageCircle size={12} />
                            {post.comments_count?.toLocaleString()}
                          </span>
                          {post.views_count > 0 && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <PlayCircle size={12} />
                              {post.views_count?.toLocaleString()}
                            </span>
                          )}
                        </p>
                        {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                      </div>
                    </div>
                    <button onClick={() => onUpdateSingleLike(post)} disabled={updatingPostId === post.id} className="text-xs bg-orange-500 text-white rounded px-2 py-1 disabled:bg-gray-400 cursor-pointer shrink-0">
                      {updatingPostId === post.id ? '...' : '갱신'}
                    </button>
                    {!post.is_cover && (
                      <button onClick={() => onConvertCover(post.id)} className="text-xs bg-purple-500 text-white rounded px-2 py-1 shrink-0">커버전환</button>
                    )}
                    <button onClick={() => onDeletePost(post)} className="text-xs bg-red-500 text-white rounded px-2 py-1 shrink-0">삭제</button>
                  </div>
                </div>
              )
            })}
          </div>
          {filteredPosts.length > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => setAdminPostPage(p => Math.max(0, p - 1))} disabled={adminPostPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
              <div className="flex gap-1">
                {Array.from({length: Math.ceil(filteredPosts.length / PAGE_SIZE)}, (_, i) => (
                  <button key={i} onClick={() => setAdminPostPage(i)} className={`text-xs px-2 py-1 border dark:border-gray-600 rounded ${adminPostPage === i ? 'bg-blue-600 text-white border-blue-600' : 'dark:text-gray-300'}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setAdminPostPage(p => Math.min(Math.ceil(filteredPosts.length / PAGE_SIZE) - 1, p + 1))} disabled={(adminPostPage + 1) * PAGE_SIZE >= filteredPosts.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
