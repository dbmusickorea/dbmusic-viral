'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PROJECT = {
  artist_name: '옐로',
  song_title: '결혼해서 좋겠다',
  client_name: '더블비뮤직',
  start_date: '2026-07-01',
  end_date: '2026-07-15',
  max_participants: 30,
  product_content: '디럭스 30',
}

const POSTS = [
  { id: 1, influencer_name: '김민지', platform: 'instagram', likes_count: 2341, comments_count: 87, views_count: 15200 },
  { id: 2, influencer_name: '박서준', platform: 'youtube', likes_count: 1823, comments_count: 124, views_count: 42300 },
  { id: 3, influencer_name: '이수빈', platform: 'tiktok', likes_count: 5621, comments_count: 234, views_count: 89400 },
  { id: 4, influencer_name: '최지우', platform: 'instagram', likes_count: 1234, comments_count: 56, views_count: 9800 },
  { id: 5, influencer_name: '정민호', platform: 'youtube', likes_count: 987, comments_count: 43, views_count: 21000 },
  { id: 6, influencer_name: '한소희', platform: 'tiktok', likes_count: 4532, comments_count: 189, views_count: 67800 },
  { id: 7, influencer_name: '윤아름', platform: 'instagram', likes_count: 876, comments_count: 34, views_count: 7600 },
  { id: 8, influencer_name: '강태양', platform: 'youtube', likes_count: 1456, comments_count: 78, views_count: 33400 },
  { id: 9, influencer_name: '송하나', platform: 'tiktok', likes_count: 3214, comments_count: 145, views_count: 54200 },
  { id: 10, influencer_name: '임지현', platform: 'instagram', likes_count: 654, comments_count: 23, views_count: 5400 },
  { id: 11, influencer_name: '오태양', platform: 'youtube', likes_count: 2134, comments_count: 98, views_count: 48700 },
  { id: 12, influencer_name: '신미래', platform: 'tiktok', likes_count: 6789, comments_count: 312, views_count: 102300 },
  { id: 13, influencer_name: '류하늘', platform: 'instagram', likes_count: 1123, comments_count: 45, views_count: 8900 },
  { id: 14, influencer_name: '문지석', platform: 'youtube', likes_count: 876, comments_count: 67, views_count: 19800 },
  { id: 15, influencer_name: '배수지', platform: 'tiktok', likes_count: 4123, comments_count: 178, views_count: 71200 },
  { id: 16, influencer_name: '조현우', platform: 'instagram', likes_count: 543, comments_count: 19, views_count: 4300 },
  { id: 17, influencer_name: '나은서', platform: 'youtube', likes_count: 1678, comments_count: 89, views_count: 37600 },
  { id: 18, influencer_name: '유승호', platform: 'tiktok', likes_count: 2987, comments_count: 134, views_count: 48900 },
  { id: 19, influencer_name: '전혜빈', platform: 'instagram', likes_count: 987, comments_count: 41, views_count: 7800 },
  { id: 20, influencer_name: '황민준', platform: 'youtube', likes_count: 1234, comments_count: 56, views_count: 27400 },
  { id: 21, influencer_name: '서예진', platform: 'tiktok', likes_count: 5432, comments_count: 245, views_count: 88700 },
  { id: 22, influencer_name: '남주혁', platform: 'instagram', likes_count: 765, comments_count: 28, views_count: 6100 },
  { id: 23, influencer_name: '안소현', platform: 'youtube', likes_count: 934, comments_count: 47, views_count: 21300 },
  { id: 24, influencer_name: '차은우', platform: 'tiktok', likes_count: 7823, comments_count: 389, views_count: 124500 },
  { id: 25, influencer_name: '민아', platform: 'instagram', likes_count: 1345, comments_count: 62, views_count: 10700 },
  { id: 26, influencer_name: '공유', platform: 'youtube', likes_count: 2134, comments_count: 112, views_count: 51200 },
  { id: 27, influencer_name: '박보영', platform: 'tiktok', likes_count: 3456, comments_count: 167, views_count: 58900 },
  { id: 28, influencer_name: '이준기', platform: 'instagram', likes_count: 876, comments_count: 35, views_count: 7200 },
  { id: 29, influencer_name: '손예진', platform: 'youtube', likes_count: 1567, comments_count: 78, views_count: 34500 },
  { id: 30, influencer_name: '현빈', platform: 'tiktok', likes_count: 4234, comments_count: 198, views_count: 69800 },
]

const DAILY_STATS = [
  { date: '07-01', 인스타_좋아요: 1200, 인스타_조회수: 8500, 유튜브_좋아요: 800, 유튜브_조회수: 15000, 틱톡_좋아요: 2100, 틱톡_조회수: 35000 },
  { date: '07-02', 인스타_좋아요: 2100, 인스타_조회수: 14200, 유튜브_좋아요: 1200, 유튜브_조회수: 24000, 틱톡_좋아요: 4200, 틱톡_조회수: 62000 },
  { date: '07-03', 인스타_좋아요: 3400, 인스타_조회수: 21000, 유튜브_좋아요: 2100, 유튜브_조회수: 38000, 틱톡_좋아요: 8900, 틱톡_조회수: 112000 },
  { date: '07-04', 인스타_좋아요: 4800, 인스타_조회수: 28000, 유튜브_좋아요: 3200, 유튜브_조회수: 54000, 틱톡_좋아요: 14500, 틱톡_조회수: 178000 },
  { date: '07-05', 인스타_좋아요: 6200, 인스타_조회수: 35000, 유튜브_좋아요: 4800, 유튜브_조회수: 72000, 틱톡_좋아요: 21000, 틱톡_조회수: 245000 },
  { date: '07-06', 인스타_좋아요: 7100, 인스타_조회수: 39000, 유튜브_좋아요: 6100, 유튜브_조회수: 89000, 틱톡_좋아요: 28000, 틱톡_조회수: 312000 },
  { date: '07-07', 인스타_좋아요: 8400, 인스타_조회수: 44000, 유튜브_좋아요: 7800, 유튜브_조회수: 108000, 틱톡_좋아요: 36000, 틱톡_조회수: 389000 },
  { date: '07-08', 인스타_좋아요: 9200, 인스타_조회수: 48000, 유튜브_좋아요: 9200, 유튜브_조회수: 124000, 틱톡_좋아요: 42000, 틱톡_조회수: 445000 },
  { date: '07-09', 인스타_좋아요: 10100, 인스타_조회수: 52000, 유튜브_좋아요: 10800, 유튜브_조회수: 142000, 틱톡_좋아요: 48000, 틱톡_조회수: 498000 },
  { date: '07-10', 인스타_좋아요: 10800, 인스타_조회수: 55000, 유튜브_좋아요: 12100, 유튜브_조회수: 158000, 틱톡_좋아요: 52000, 틱톡_조회수: 534000 },
  { date: '07-11', 인스타_좋아요: 11200, 인스타_조회수: 57000, 유튜브_좋아요: 13200, 유튜브_조회수: 171000, 틱톡_좋아요: 55000, 틱톡_조회수: 562000 },
  { date: '07-12', 인스타_좋아요: 11600, 인스타_조회수: 59000, 유튜브_좋아요: 14100, 유튜브_조회수: 182000, 틱톡_좋아요: 57000, 틱톡_조회수: 581000 },
  { date: '07-13', 인스타_좋아요: 11900, 인스타_조회수: 60500, 유튜브_좋아요: 14800, 유튜브_조회수: 191000, 틱톡_좋아요: 58500, 틱톡_조회수: 594000 },
  { date: '07-14', 인스타_좋아요: 12200, 인스타_조회수: 62000, 유튜브_좋아요: 15300, 유튜브_조회수: 198000, 틱톡_좋아요: 59500, 틱톡_조회수: 604000 },
  { date: '07-15', 인스타_좋아요: 12456, 인스타_조회수: 63200, 유튜브_좋아요: 15678, 유튜브_조회수: 203400, 틱톡_좋아요: 60234, 틱톡_조회수: 612300 },
]

const platformColor = { instagram: '#E1306C', youtube: '#FF0000', tiktok: '#000000' }
const platformName = { instagram: '인스타그램', youtube: '유튜브', tiktok: '틱톡' }

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'posts'>('stats')

  const totalLikes = POSTS.reduce((s, p) => s + p.likes_count, 0)
  const totalComments = POSTS.reduce((s, p) => s + p.comments_count, 0)
  const totalViews = POSTS.reduce((s, p) => s + p.views_count, 0)

  const instaCount = POSTS.filter(p => p.platform === 'instagram').length
  const youtubeCount = POSTS.filter(p => p.platform === 'youtube').length
  const tiktokCount = POSTS.filter(p => p.platform === 'tiktok').length

  const sortedPosts = [...POSTS].sort((a, b) => b.likes_count - a.likes_count)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="text-xs text-gray-400">데모 프로젝트</p>
          <h1 className="font-bold text-sm">{PROJECT.artist_name} / {PROJECT.song_title}</h1>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">샘플 데이터</span>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b flex">
        <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>현황</button>
        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>게시물</button>
      </div>

      <div className="p-4">
        {activeTab === 'stats' && (
          <>
            {/* 프로젝트 정보 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📋 프로젝트 정보</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['기간', `${PROJECT.start_date} ~ ${PROJECT.end_date}`],
                  ['모집인원', `${PROJECT.max_participants}명`],
                  ['인스타그램', `${instaCount}명`],
                  ['유튜브', `${youtubeCount}명`],
                  ['틱톡', `${tiktokCount}명`],
                  ['상품', PROJECT.product_content],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-xs text-gray-500 shrink-0">{label}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 총 통계 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📊 총 성과</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['총 좋아요', totalLikes.toLocaleString()],
                  ['총 댓글', totalComments.toLocaleString()],
                  ['총 조회수', totalViews.toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-blue-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SNS별 통계 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📱 SNS별 통계</h2>
              {(['instagram', 'youtube', 'tiktok'] as const).map(platform => {
                const platformPosts = POSTS.filter(p => p.platform === platform)
                const likes = platformPosts.reduce((s, p) => s + p.likes_count, 0)
                const comments = platformPosts.reduce((s, p) => s + p.comments_count, 0)
                const views = platformPosts.reduce((s, p) => s + p.views_count, 0)
                return (
                  <div key={platform} className="mb-4">
                    <p className="text-sm font-medium mb-2" style={{color: platformColor[platform]}}>{platformName[platform]}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[['좋아요', likes], ['댓글', comments], ['조회수', views]].map(([label, value]) => (
                        <div key={label as string} className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-sm font-bold">{(value as number).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 일별 차트 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📈 일별 좋아요 추이</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DAILY_STATS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="인스타_좋아요" stroke="#E1306C" name="인스타" dot={false} />
                  <Line type="monotone" dataKey="유튜브_좋아요" stroke="#FF0000" name="유튜브" dot={false} />
                  <Line type="monotone" dataKey="틱톡_좋아요" stroke="#000000" name="틱톡" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 조회수 차트 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📈 일별 조회수 추이</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DAILY_STATS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="인스타_조회수" stroke="#E1306C" name="인스타" dot={false} />
                  <Line type="monotone" dataKey="유튜브_조회수" stroke="#FF0000" name="유튜브" dot={false} />
                  <Line type="monotone" dataKey="틱톡_조회수" stroke="#000000" name="틱톡" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 순위 TOP 5 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">🏆 좋아요 TOP 5</h2>
              <div className="space-y-2">
                {sortedPosts.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</span>
                    <span className="text-sm flex-1">{p.influencer_name}</span>
                    <span className="text-xs text-gray-400">{platformName[p.platform as keyof typeof platformName]}</span>
                    <span className="text-sm font-medium">❤️ {p.likes_count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'posts' && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">📝 게시물 목록</h2>
            <div className="space-y-3">
              {POSTS.map(p => (
                <div key={p.id} className="border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{p.influencer_name}</p>
                      <p className="text-xs text-gray-400">{platformName[p.platform as keyof typeof platformName]}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">샘플</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">좋아요</p>
                      <p className="text-sm font-medium">{p.likes_count.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">댓글</p>
                      <p className="text-sm font-medium">{p.comments_count.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">조회수</p>
                      <p className="text-sm font-medium">{p.views_count.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
