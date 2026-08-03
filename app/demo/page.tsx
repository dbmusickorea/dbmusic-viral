'use client'

import { useState } from 'react'
import StatsChart from '../../components/StatsChart'
import PlatformIcon from '../../components/PlatformIcon'
import { Heart, ThumbsUp, MessageCircle, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const projectInfo = {
  artist_name: '옐로',
  song_title: '결혼해서 좋겠다',
  client_name: '더블비뮤직',
  start_date: '2026-07-01',
  end_date: '2026-07-15',
  max_participants: 30,
  product_content: '디럭스 30',
  required_posts: 1,
  monitoring_extension: 15,
  refresh_interval: '1',
  cover_video_count: 3,
  requirements: '음원은 꼭 오디오 당겨와서 해주세요.\n인스타그램은 사진만 올리셔도 꼭 릴스로 올려주세요.\n해시태그 #결혼 #축가 #신부입장 #옐로 #결혼해서좋겠다',
  instagram_audio_id: null,
  tiktok_audio_id: null,
  youtube_audio_id: null,
  status: 'COMPLETED',
  project_code: 'DEMO',
  document_id: null,
}

const posts = [
  { id: 1, influencer_name: '김민지', platform: 'instagram', likes_count: 2341, comments_count: 87, views_count: 15200, post_url: '#', created_at: '2026-07-01', participant: { instagram_id: 'minji_kim', instagram_followers: 12400, instagram_profile_image: null } },
  { id: 2, influencer_name: '박서준', platform: 'youtube', likes_count: 1823, comments_count: 124, views_count: 42300, post_url: '#', created_at: '2026-07-01', participant: { youtube_id: 'seojun_park', youtube_subscribers: 8900, youtube_profile_image: null } },
  { id: 3, influencer_name: '이수빈', platform: 'tiktok', likes_count: 5621, comments_count: 234, views_count: 89400, post_url: '#', created_at: '2026-07-02', participant: { tiktok_id: 'subin_lee', tiktok_followers: 23100, tiktok_profile_image: null } },
  { id: 4, influencer_name: '최지우', platform: 'instagram', likes_count: 1234, comments_count: 56, views_count: 9800, post_url: '#', created_at: '2026-07-02', participant: { instagram_id: 'jiwoo_choi', instagram_followers: 6700, instagram_profile_image: null } },
  { id: 5, influencer_name: '정민호', platform: 'youtube', likes_count: 987, comments_count: 43, views_count: 21000, post_url: '#', created_at: '2026-07-03', participant: { youtube_id: 'minho_jung', youtube_subscribers: 5400, youtube_profile_image: null } },
  { id: 6, influencer_name: '한소희', platform: 'tiktok', likes_count: 4532, comments_count: 189, views_count: 67800, post_url: '#', created_at: '2026-07-03', participant: { tiktok_id: 'sohee_han', tiktok_followers: 18900, tiktok_profile_image: null } },
  { id: 7, influencer_name: '윤아름', platform: 'instagram', likes_count: 1876, comments_count: 67, views_count: 14200, post_url: '#', created_at: '2026-07-04', participant: { instagram_id: 'areum_yoon', instagram_followers: 9300, instagram_profile_image: null } },
  { id: 8, influencer_name: '강태양', platform: 'youtube', likes_count: 1456, comments_count: 78, views_count: 33400, post_url: '#', created_at: '2026-07-04', participant: { youtube_id: 'taeyang_kang', youtube_subscribers: 7200, youtube_profile_image: null } },
  { id: 9, influencer_name: '송하나', platform: 'tiktok', likes_count: 3214, comments_count: 145, views_count: 54200, post_url: '#', created_at: '2026-07-05', participant: { tiktok_id: 'hana_song', tiktok_followers: 14500, tiktok_profile_image: null } },
  { id: 10, influencer_name: '임지현', platform: 'instagram', likes_count: 1654, comments_count: 72, views_count: 12400, post_url: '#', created_at: '2026-07-05', participant: { instagram_id: 'jihyun_lim', instagram_followers: 8100, instagram_profile_image: null } },
  { id: 11, influencer_name: '오태양', platform: 'youtube', likes_count: 2134, comments_count: 98, views_count: 48700, post_url: '#', created_at: '2026-07-06', participant: { youtube_id: 'taeyang_oh', youtube_subscribers: 11200, youtube_profile_image: null } },
  { id: 12, influencer_name: '신미래', platform: 'tiktok', likes_count: 6789, comments_count: 312, views_count: 102300, post_url: '#', created_at: '2026-07-06', participant: { tiktok_id: 'mirae_shin', tiktok_followers: 28700, tiktok_profile_image: null } },
  { id: 13, influencer_name: '류하늘', platform: 'instagram', likes_count: 1123, comments_count: 45, views_count: 8900, post_url: '#', created_at: '2026-07-07', participant: { instagram_id: 'haneul_ryu', instagram_followers: 5600, instagram_profile_image: null } },
  { id: 14, influencer_name: '문지석', platform: 'youtube', likes_count: 1876, comments_count: 89, views_count: 42100, post_url: '#', created_at: '2026-07-07', participant: { youtube_id: 'jisuk_moon', youtube_subscribers: 9800, youtube_profile_image: null } },
  { id: 15, influencer_name: '배수지', platform: 'tiktok', likes_count: 4123, comments_count: 178, views_count: 71200, post_url: '#', created_at: '2026-07-08', participant: { tiktok_id: 'suji_bae', tiktok_followers: 19600, tiktok_profile_image: null } },
  { id: 16, influencer_name: '조현우', platform: 'instagram', likes_count: 1543, comments_count: 61, views_count: 11700, post_url: '#', created_at: '2026-07-08', participant: { instagram_id: 'hyunwoo_jo', instagram_followers: 7400, instagram_profile_image: null } },
  { id: 17, influencer_name: '나은서', platform: 'youtube', likes_count: 1678, comments_count: 76, views_count: 37600, post_url: '#', created_at: '2026-07-09', participant: { youtube_id: 'eunseo_na', youtube_subscribers: 8300, youtube_profile_image: null } },
  { id: 18, influencer_name: '유승호', platform: 'tiktok', likes_count: 2987, comments_count: 134, views_count: 48900, post_url: '#', created_at: '2026-07-09', participant: { tiktok_id: 'seungho_yoo', tiktok_followers: 13200, tiktok_profile_image: null } },
  { id: 19, influencer_name: '전혜빈', platform: 'instagram', likes_count: 1987, comments_count: 83, views_count: 15100, post_url: '#', created_at: '2026-07-10', participant: { instagram_id: 'hyebin_jun', instagram_followers: 10200, instagram_profile_image: null } },
  { id: 20, influencer_name: '황민준', platform: 'youtube', likes_count: 1234, comments_count: 56, views_count: 27400, post_url: '#', created_at: '2026-07-10', participant: { youtube_id: 'minjun_hwang', youtube_subscribers: 6100, youtube_profile_image: null } },
  { id: 21, influencer_name: '서예진', platform: 'tiktok', likes_count: 5432, comments_count: 245, views_count: 88700, post_url: '#', created_at: '2026-07-11', participant: { tiktok_id: 'yejin_seo', tiktok_followers: 24300, tiktok_profile_image: null } },
  { id: 22, influencer_name: '남주혁', platform: 'instagram', likes_count: 1765, comments_count: 74, views_count: 13400, post_url: '#', created_at: '2026-07-11', participant: { instagram_id: 'juhyuk_nam', instagram_followers: 9100, instagram_profile_image: null } },
  { id: 23, influencer_name: '안소현', platform: 'youtube', likes_count: 1934, comments_count: 91, views_count: 43200, post_url: '#', created_at: '2026-07-12', participant: { youtube_id: 'sohyun_an', youtube_subscribers: 10500, youtube_profile_image: null } },
  { id: 24, influencer_name: '차은우', platform: 'tiktok', likes_count: 7823, comments_count: 389, views_count: 124500, post_url: '#', created_at: '2026-07-12', participant: { tiktok_id: 'eunwoo_cha', tiktok_followers: 35600, tiktok_profile_image: null } },
  { id: 25, influencer_name: '민아', platform: 'instagram', likes_count: 1345, comments_count: 58, views_count: 10200, post_url: '#', created_at: '2026-07-13', participant: { instagram_id: 'mina_min', instagram_followers: 7000, instagram_profile_image: null } },
  { id: 26, influencer_name: '공유', platform: 'youtube', likes_count: 2134, comments_count: 112, views_count: 51200, post_url: '#', created_at: '2026-07-13', participant: { youtube_id: 'yoo_gong', youtube_subscribers: 12800, youtube_profile_image: null } },
  { id: 27, influencer_name: '박보영', platform: 'tiktok', likes_count: 3456, comments_count: 167, views_count: 58900, post_url: '#', created_at: '2026-07-14', participant: { tiktok_id: 'boyoung_park', tiktok_followers: 16700, tiktok_profile_image: null } },
  { id: 28, influencer_name: '이준기', platform: 'instagram', likes_count: 1876, comments_count: 79, views_count: 14300, post_url: '#', created_at: '2026-07-14', participant: { instagram_id: 'junki_lee', instagram_followers: 9700, instagram_profile_image: null } },
  { id: 29, influencer_name: '손예진', platform: 'youtube', likes_count: 1567, comments_count: 73, views_count: 34500, post_url: '#', created_at: '2026-07-15', participant: { youtube_id: 'yejin_son', youtube_subscribers: 7900, youtube_profile_image: null } },
  { id: 30, influencer_name: '현빈', platform: 'tiktok', likes_count: 4234, comments_count: 198, views_count: 69800, post_url: '#', created_at: '2026-07-15', participant: { tiktok_id: 'hyunbin', tiktok_followers: 20100, tiktok_profile_image: null } },
]

const dailyStats = [
  { date: '07-01', ig_likes: 1200, ig_comments: 45, ig_views: 8500, yt_likes: 800, yt_comments: 34, yt_views: 15000, tt_likes: 2100, tt_comments: 89, tt_views: 35000 },
  { date: '07-02', ig_likes: 2100, ig_comments: 78, ig_views: 14200, yt_likes: 1200, yt_comments: 56, yt_views: 24000, tt_likes: 4200, tt_comments: 167, tt_views: 62000 },
  { date: '07-03', ig_likes: 3400, ig_comments: 112, ig_views: 21000, yt_likes: 2100, yt_comments: 89, yt_views: 38000, tt_likes: 8900, tt_comments: 312, tt_views: 112000 },
  { date: '07-04', ig_likes: 4800, ig_comments: 145, ig_views: 28000, yt_likes: 3200, yt_comments: 123, yt_views: 54000, tt_likes: 14500, tt_comments: 478, tt_views: 178000 },
  { date: '07-05', ig_likes: 6200, ig_comments: 178, ig_views: 35000, yt_likes: 4800, yt_comments: 167, yt_views: 72000, tt_likes: 21000, tt_comments: 623, tt_views: 245000 },
  { date: '07-06', ig_likes: 7100, ig_comments: 198, ig_views: 39000, yt_likes: 6100, yt_comments: 212, yt_views: 89000, tt_likes: 28000, tt_comments: 756, tt_views: 312000 },
  { date: '07-07', ig_likes: 8400, ig_comments: 223, ig_views: 44000, yt_likes: 7800, yt_comments: 256, yt_views: 108000, tt_likes: 36000, tt_comments: 867, tt_views: 389000 },
  { date: '07-08', ig_likes: 9200, ig_comments: 245, ig_views: 48000, yt_likes: 9200, yt_comments: 298, yt_views: 124000, tt_likes: 42000, tt_comments: 934, tt_views: 445000 },
  { date: '07-09', ig_likes: 10100, ig_comments: 267, ig_views: 52000, yt_likes: 10800, yt_comments: 334, yt_views: 142000, tt_likes: 48000, tt_comments: 1023, tt_views: 498000 },
  { date: '07-10', ig_likes: 10800, ig_comments: 284, ig_views: 55000, yt_likes: 12100, yt_comments: 367, yt_views: 158000, tt_likes: 52000, tt_comments: 1089, tt_views: 534000 },
  { date: '07-11', ig_likes: 11200, ig_comments: 298, ig_views: 57000, yt_likes: 13200, yt_comments: 389, yt_views: 171000, tt_likes: 55000, tt_comments: 1134, tt_views: 562000 },
  { date: '07-12', ig_likes: 11600, ig_comments: 312, ig_views: 59000, yt_likes: 14100, yt_comments: 412, yt_views: 182000, tt_likes: 57000, tt_comments: 1178, tt_views: 581000 },
  { date: '07-13', ig_likes: 11900, ig_comments: 323, ig_views: 60500, yt_likes: 14800, yt_comments: 431, yt_views: 191000, tt_likes: 58500, tt_comments: 1212, tt_views: 594000 },
  { date: '07-14', ig_likes: 12200, ig_comments: 334, ig_views: 62000, yt_likes: 15300, yt_comments: 445, yt_views: 198000, tt_likes: 59500, tt_comments: 1245, tt_views: 604000 },
  { date: '07-15', ig_likes: 12456, ig_comments: 342, ig_views: 63200, yt_likes: 15678, yt_comments: 456, yt_views: 203400, tt_likes: 60234, tt_comments: 1267, tt_views: 612300 },
]

const PAGE_SIZE = 10

export default function DemoPage() {
  const router = useRouter()
  const [postPage, setPostPage] = useState(0)

  const totalLikes = posts.reduce((s, p) => s + p.likes_count, 0)
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0)

  const instaPosts = posts.filter(p => p.platform === 'instagram')
  const youtubePosts = posts.filter(p => p.platform === 'youtube')
  const tiktokPosts = posts.filter(p => p.platform === 'tiktok')

  const snsList = [
    { label: '인스타그램', posts: instaPosts, links: [], icon: <PlatformIcon platform="instagram" size={16} /> },
    { label: '유튜브', posts: youtubePosts, links: [], icon: <PlatformIcon platform="youtube" size={16} /> },
    { label: '틱톡', posts: tiktokPosts, links: [], icon: <svg viewBox="0 0 24 24" className="w-4 h-4 inline" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
  ]

  const topRanker = [...posts].sort((a, b) => b.likes_count - a.likes_count)[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => window.close()} className="text-gray-400 p-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <p className="text-xs text-gray-400">샘플 프로젝트</p>
            <h1 className="font-bold text-sm">{projectInfo.artist_name} / {projectInfo.song_title}</h1>
          </div>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">샘플 데이터</span>
      </div>

      <div className="p-4">
        {/* 프로젝트 기간 + 정보 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500 mb-1">📅 프로젝트 기간</p>
            <p className="text-xs">시작일: {projectInfo.start_date}</p>
            <p className="text-xs">종료일: {projectInfo.end_date}</p>
            <p className="text-xs">진행일수: 15일</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-3">
            <p className="text-xs text-gray-500 mb-1">📦 프로젝트 정보</p>
            <p className="text-xs">가수명: {projectInfo.artist_name}</p>
            <p className="text-xs">노래제목: {projectInfo.song_title}</p>
            <p className="text-xs">상품: {projectInfo.product_content}</p>
            <p className="text-xs">모집인원: {projectInfo.max_participants}명</p>
            <p className="text-xs">모니터링 연장: {projectInfo.monitoring_extension}일</p>
            <p className="text-xs">커버영상: {projectInfo.cover_video_count}개</p>
          </div>
        </div>

        {/* 요청사항 */}
        <div className="bg-white rounded-2xl shadow p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">📋 의뢰인 요청사항</p>
          <p className="text-xs whitespace-pre-wrap text-gray-700">{projectInfo.requirements}</p>
        </div>

        {/* 총 통계 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📊 전체 통계</h2>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">🏆 1등</p>
              <p className="text-sm font-bold text-yellow-700">{topRanker.influencer_name}</p>
              <p className="text-xs text-gray-500">❤️ {topRanker.likes_count.toLocaleString()}</p>
            </div>
          </div>

          {/* 일별 차트 */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">📈 일별 변화 추이</p>

            {/* 인스타그램 */}
            <StatsChart data={dailyStats} platform="instagram" likesKey="ig_likes" commentsKey="ig_comments" viewsKey="ig_views" />

            {/* 유튜브 */}
            <StatsChart data={dailyStats} platform="youtube" likesKey="yt_likes" commentsKey="yt_comments" viewsKey="yt_views" />

            {/* 틱톡 */}
            <StatsChart data={dailyStats} platform="tiktok" likesKey="tt_likes" commentsKey="tt_comments" viewsKey="tt_views" />
            <p className="text-xs text-gray-400 mt-1 text-center">※ 데이터는 선택하신 상품에 따라 1~12시간 간격으로 갱신됩니다</p>
          </div>
        </div>

        {/* SNS별 통계 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📱 SNS별 통계</h2>
          <div className="space-y-2">
            {snsList.map(({ label, posts: snsPosts, icon }) => (
              <div key={label} className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-2 flex items-center gap-1">{icon} {label}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">게시물</p>
                    <p className="text-sm font-bold">{snsPosts.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{label === '유튜브' ? '좋아요' : '하트'}</p>
                    <p className="text-sm font-bold text-red-500">{snsPosts.reduce((s, p) => s + p.likes_count, 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">댓글</p>
                    <p className="text-sm font-bold text-green-600">{snsPosts.reduce((s, p) => s + p.comments_count, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-2">※ 게시물 수는 더블비뮤직 체험단 업로드 기준이며, 음원 사용량은 인스타그램/틱톡 전체 기준(체험단 외 일반 사용자 포함)입니다.</p>
          </div>
        </div>

        {/* 게시물 목록 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">게시물 목록</h2>
          <div className="space-y-3">
            {[...posts]
              .sort((a, b) => b.likes_count - a.likes_count)
              .slice(postPage * PAGE_SIZE, (postPage + 1) * PAGE_SIZE)
              .map((post, index) => {
                const rank = postPage * PAGE_SIZE + index + 1
                const isEligible = post.likes_count >= 1000
                return (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex gap-3">
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <PlatformIcon platform={post.platform} size={24} />
                          {post.platform === 'tiktok' && <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {isEligible && (
                                <span className={`text-xs font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`}
                                </span>
                              )}
                              <p className="text-sm font-medium">{post.influencer_name}</p>
                              {post.platform === 'instagram' && <span className="text-xs text-gray-500">@{post.participant.instagram_id} ({post.participant.instagram_followers?.toLocaleString()}명)</span>}
                              {post.platform === 'youtube' && <span className="text-xs text-gray-500">@{post.participant.youtube_id} ({post.participant.youtube_subscribers?.toLocaleString()}명)</span>}
                              {post.platform === 'tiktok' && <span className="text-xs text-gray-500">@{post.participant.tiktok_id} ({post.participant.tiktok_followers?.toLocaleString()}명)</span>}
                            </div>
                            <p className="text-xs text-gray-500">{post.platform} · {post.created_at}</p>
                            {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm flex items-center justify-end gap-1">
                              {post.platform === 'youtube' ? <ThumbsUp size={12} className="text-red-500" /> : <Heart size={12} className="text-red-500" />}
                              {post.likes_count.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                              <MessageCircle size={12} />{post.comments_count.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                              <PlayCircle size={12} />{post.views_count.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-300 mt-1 block">링크 보기 →</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            {posts.length > PAGE_SIZE && (
              <div className="flex justify-between items-center mt-3">
                <button onClick={() => setPostPage(p => Math.max(0, p - 1))} disabled={postPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                <div className="flex gap-1">
                  {Array.from({length: Math.ceil(posts.length / PAGE_SIZE)}, (_, i) => (
                    <button key={i} onClick={() => setPostPage(i)} className={`text-xs px-2 py-1 border rounded ${postPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                  ))}
                </div>
                <button onClick={() => setPostPage(p => Math.min(Math.ceil(posts.length / PAGE_SIZE) - 1, p + 1))} disabled={(postPage + 1) * PAGE_SIZE >= posts.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
