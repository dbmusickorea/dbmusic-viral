'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page2() {
  const [projectVideos, setProjectVideos] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [requirements, setRequirements] = useState('')
  const [projectStatus, setProjectStatus] = useState('')
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [influencerName, setInfluencerName] = useState('')
  const [commentMissions, setCommentMissions] = useState<any[]>([])
  const [youtubeHandle, setYoutubeHandle] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [snsAccount, setSnsAccount] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [platform, setPlatform] = useState('')
  const [showExchange, setShowExchange] = useState(false)
  const [residentNumber, setResidentNumber] = useState('')
  const [address, setAddress] = useState('')
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [showMyInfo, setShowMyInfo] = useState(false)
  const [myName, setMyName] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myBankName, setMyBankName] = useState('')
  const [myAccountHolder, setMyAccountHolder] = useState('')
  const [myAccountNumber, setMyAccountNumber] = useState('')
  const [myInstagram, setMyInstagram] = useState('')
  const [myYoutube, setMyYoutube] = useState('')
  const [myTiktok, setMyTiktok] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [balance, setBalance] = useState(0)
  const [level, setLevel] = useState(1)
  const [referralCode, setReferralCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [mySettlements, setMySettlements] = useState<any[]>([])
  const [projectsMap, setProjectsMap] = useState<any>({})
  const [showPosts, setShowPosts] = useState(false)
  const [postFilter, setPostFilter] = useState<'current' | 'all'>('current')
  const [isJoined, setIsJoined] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [allProjects, setAllProjects] = useState<any[]>([])
  const router = useRouter()

useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')
    fetchParticipantInfo(parsed.id)
    fetchMyPostsAndProjects(parsed.id)
    fetchMySettlements(parsed.id)
    fetchCommentMissions(parsed.id)
    fetchAllProjects()
  }, [])

  const handleCommentVerify = async (videoId: string, projectCode: string) => {
    if (!youtubeHandle) { alert('유튜브 계정명을 입력해주세요.'); return }
    
    // 중복 체크
    const already = commentMissions.find(m => m.video_id === videoId && m.member_id === userInfo?.id)
    if (already) { alert('이미 이 영상으로 보상을 받으셨습니다.'); return }
    
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/comments?videoId=${videoId}&handle=${encodeURIComponent(youtubeHandle)}`)
      const data = await response.json()
      
      if (data.found) {
        // 미션 저장 + 적립금 추가
        await supabase.from('comment_missions').insert({
          project_code: projectCode,
          member_id: userInfo?.id,
          video_id: videoId,
          youtube_handle: youtubeHandle,
          status: 'APPROVED',
          reward_amount: 300
        })
        const newBalance = balance + 300
        await supabase.from('participants').update({ balance: newBalance }).eq('id', userInfo?.id)
        setBalance(newBalance)
        fetchCommentMissions(userInfo?.id)
        alert('✅ 댓글 인증 완료! 300원이 적립됐어요!')
      } else {
        alert('❌ 댓글을 찾을 수 없어요. 유튜브 계정명을 다시 확인해주세요.')
      }
    } catch {
      alert('인증 실패! 다시 시도해주세요.')
    }
    setIsVerifying(false)
    setYoutubeHandle('')
  }
  
  const fetchCommentMissions = async (id: number) => {
    const { data } = await supabase.from('comment_missions').select('*').eq('member_id', id)
    setCommentMissions(data ?? [])
  }

  const fetchAllProjects = async () => {
    const { data } = await supabase.from('projects').select('*').eq('status', 'ONGOING').order('created_at', { ascending: false })
    setAllProjects(data ?? [])
  }

  const fetchParticipantInfo = async (id: number) => {
    const { data } = await supabase.from('participants').select('balance, level, referral_code, name, instagram_id, youtube_id, tiktok_id').eq('id', id).maybeSingle()
    setBalance(data?.balance ?? 0)
    setLevel(data?.level ?? 1)
    setReferralCode(data?.referral_code ?? '')
    setInfluencerName(data?.name ?? '')
    // SNS 계정 저장용 (플랫폼 선택 시 자동 설정)
    if (data) {
      localStorage.setItem('snsAccounts', JSON.stringify({
        instagram: data.instagram_id ?? '',
        youtube: data.youtube_id ?? '',
        tiktok: data.tiktok_id ?? ''
      }))
    }
  }

  const fetchMySettlements = async (id: number) => {
    const { data } = await supabase.from('settlements').select('*').eq('member_id', id).order('requested_at', { ascending: false })
    setMySettlements(data ?? [])
  }

  const fetchMyPostsAndProjects = async (id: number) => {
    const { data: posts } = await supabase.from('posts').select('*').eq('member_id', id).order('created_at', { ascending: false })
    setMyPosts(posts ?? [])
    if (posts && posts.length > 0) {
      const codes = [...new Set(posts.map(p => p.project_code))]
      const { data: projects } = await supabase.from('projects').select('project_code, status, reward_per_post, start_date, end_date').in('project_code', codes)
      const map: any = {}
      projects?.forEach(p => { map[p.project_code] = p })
      setProjectsMap(map)
    }
  }

  const getRequirements = async (code: string) => {
    const { data } = await supabase
      .from('projects')
      .select('requirements, status, start_date, end_date, reward_per_post, max_participants, mission_date, mission_time')
      .ilike('project_code', code)
      .maybeSingle()
    setRequirements(data?.requirements ?? '')
    setProjectStatus(data?.status ?? '')
    setProjectInfo(data)
    const { data: videos } = await supabase.from('project_videos').select('*').ilike('project_code', code).maybeSingle()
    setProjectVideos(videos)
    // 참여 여부 및 인원 수 확인
    const { data: joinData } = await supabase.from('project_participants')
      .select('id').ilike('project_code', code).eq('member_id', userInfo?.id).maybeSingle()
    setIsJoined(!!joinData)
    
    const { count } = await supabase.from('project_participants')
      .select('*', { count: 'exact', head: true }).ilike('project_code', code)
    setParticipantCount(count ?? 0)
  }

  const handleJoin = async () => {
    if (!projectCode || !userInfo) return
    const maxP = projectInfo?.max_participants ?? 0
    if (maxP > 0 && participantCount >= maxP) {
      alert('모집이 마감됐어요.')
      return
    }
    const { error } = await supabase.from('project_participants').insert({
      project_code: projectCode,
      member_id: userInfo.id
    })
    if (error) { alert('이미 참여하셨거나 오류가 발생했어요.'); return }
    setIsJoined(true)
    setParticipantCount(prev => prev + 1)
    alert('✅ 참여 완료!')
  }

  const getInstagramStats = async (url: string) => {
    try {
      const shortcode = url.split('/p/')[1]?.split('/')[0]
      if (!shortcode) return { likes: 0, comments: 0 }
      const response = await fetch(`/api/instagram?shortcode=${shortcode}`)
      const data = await response.json()
      return { likes: data.like_count ?? 0, comments: data.comment_count ?? 0 }
    } catch { return { likes: 0, comments: 0 } }
  }

  const getYoutubeStats = async (url: string) => {
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return { likes: data.likes ?? 0, comments: data.comments ?? 0 }
    } catch { return { likes: 0, comments: 0 } }
  }

  const getTiktokStats = async (url: string) => {
    try {
      const response = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return { likes: data.likes ?? 0, comments: data.comments ?? 0 }
    } catch { return { likes: 0, comments: 0 } }
  }

  const getLevelRate = (lv: number) => 1 + (lv - 1) * 0.05
  const getLevelAmount = (baseAmount: number, lv: number) => {
    const amount = Math.round(baseAmount * getLevelRate(lv))
    return Math.min(amount, 20000)
  }

  const handleSubmit = async () => {
    if (!projectCode || !postUrl) { alert('프로젝트 코드와 미션 링크를 입력해주세요.'); return }
    setIsSubmitting(true)
    let likesCount = 0
    let commentsCount = 0

    if (platform === 'instagram') {
      const stats = await getInstagramStats(postUrl)
      likesCount = stats.likes; commentsCount = stats.comments
    } else if (platform === 'youtube') {
      const stats = await getYoutubeStats(postUrl)
      likesCount = stats.likes; commentsCount = stats.comments
    } else if (platform === 'tiktok') {
      const stats = await getTiktokStats(postUrl)
      likesCount = stats.likes; commentsCount = stats.comments
    }

    const { error } = await supabase.from('posts').insert({
      project_code: projectCode.toUpperCase(),
      influencer_name: influencerName,
      post_url: postUrl,
      platform,
      member_id: userInfo?.id,
      likes_count: likesCount,
      comments_count: commentsCount
    })

    if (error) { setIsSubmitting(false); alert('미션 제출 실패!'); return }

    const { data: projectData } = await supabase
      .from('projects')
      .select('reward_per_post')
      .ilike('project_code', projectCode)
      .maybeSingle()

    if (projectData?.reward_per_post) {
      const earnAmount = getLevelAmount(projectData.reward_per_post, level)
      const newBalance = balance + earnAmount
      await supabase.from('participants').update({ balance: newBalance }).eq('id', userInfo?.id)
      setBalance(newBalance)
      alert(`미션 제출 완료! +${earnAmount.toLocaleString()}원 적립됐어요 🎉`)
    } else {
      alert('미션 제출 완료!')
    }

    setIsSubmitting(false)
    fetchMyPostsAndProjects(userInfo?.id)
    setProjectCode(''); setInfluencerName(''); setSnsAccount(''); setPostUrl('')
    setPlatform('instagram'); setRequirements(''); setProjectStatus(''); setProjectInfo(null)
  }

  const handleExchange = async () => {
    if (!exchangeAmount) { alert('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    if (amount < 10000) { alert('최소 10,000원 이상부터 환전 신청 가능합니다.'); return }
    if (amount > balance) { alert('신청 금액이 잔액을 초과합니다.'); return }
    if (projectCode && projectStatus !== 'COMPLETED') { alert('프로젝트가 종료된 후에만 환전 신청이 가능합니다.'); return }
    const taxAmount = Math.floor(amount * 0.033)
    const netAmount = amount - taxAmount
    const { error } = await supabase.from('settlements').insert({
      member_id: userInfo?.id, amount, tax_amount: taxAmount, net_amount: netAmount,
      resident_number: residentNumber, address, status: 'PENDING'
    })
    if (error) { alert('환전 신청 실패!'); return }
    alert('환전 신청 완료!')
    fetchMySettlements(userInfo?.id)
    setShowExchange(false); setResidentNumber(''); setAddress(''); setExchangeAmount('')
  }

  const loadMyInfo = () => {
    setMyName(userInfo?.name ?? ''); setMyMobile(userInfo?.mobile ?? '')
    setMyBankName(userInfo?.bank_name ?? ''); setMyAccountHolder(userInfo?.account_holder ?? '')
    setMyAccountNumber(userInfo?.account_number ?? ''); setMyInstagram(userInfo?.instagram_id ?? '')
    setMyYoutube(userInfo?.youtube_id ?? ''); setMyTiktok(userInfo?.tiktok_id ?? '')
    setShowMyInfo(true)
  }

  const handleUpdateMyInfo = async () => {
    const { error } = await supabase.from('participants').update({
      name: myName, mobile: myMobile, bank_name: myBankName,
      account_holder: myAccountHolder, account_number: myAccountNumber,
      instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok,
      password: myPassword || userInfo?.password
    }).eq('id', userInfo?.id)
    if (error) { alert('수정 실패!'); return }
    alert('정보 수정 완료!')
    setShowMyInfo(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const activePosts = myPosts.filter(p => projectsMap[p.project_code]?.status === 'ONGOING')
  const displayPosts = postFilter === 'current' ? activePosts : myPosts

  const instagramPosts = displayPosts.filter(p => p.platform === 'instagram')
  const youtubePosts = displayPosts.filter(p => p.platform === 'youtube')
  const tiktokPosts = displayPosts.filter(p => p.platform === 'tiktok')

  const statusBadge = (code: string) => {
    const s = projectsMap[code]?.status
    if (s === 'ONGOING') return <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">진행중</span>
    if (s === 'COMPLETED') return <span className="text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">완료</span>
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">대기중</span>
  }

  const settlementStatusLabel = (s: string) => {
    if (s === 'APPROVED') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">승인</span>
    if (s === 'REJECTED') return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">거절</span>
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">대기</span>
  }

  const getPlatformLabel = (p: string) => {
    if (p === 'instagram') return '제출 중... (Instagram 데이터 수집 중)'
    if (p === 'youtube') return '제출 중... (YouTube 데이터 수집 중)'
    if (p === 'tiktok') return '제출 중... (TikTok 데이터 수집 중)'
    return '제출 중...'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">🎵 DBMUSIC 체험단</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-1">
              <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
              <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
              <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
              <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
            </div>
          )}
        </div>

        {/* 적립금 + 레벨 + 추천인 코드 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm text-gray-500">나의 적립금</p>
              <p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()}원</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Lv.{level} ({Math.round(getLevelRate(level) * 100)}%)</span>
          </div>
          {referralCode && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500">나의 추천인 코드</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-lg font-bold text-blue-600">{referralCode}</p>
                <button onClick={() => { navigator.clipboard.writeText(referralCode); alert('추천인 코드가 복사됐어요!') }} className="text-xs border rounded px-2 py-1 text-gray-600">복사</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">친구에게 이 코드를 알려주세요!</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowExchange(!showExchange); setShowMyInfo(false) }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${showExchange ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}
            >
              환전 신청
            </button>
            <button
              onClick={() => { loadMyInfo(); setShowExchange(false) }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${showMyInfo ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}
            >
              내 정보 보기
            </button>
          </div>

          {/* 환전 신청 폼 - 버튼 바로 아래 */}
          {showExchange && (
            <div className="mt-4 border-t pt-4">
              <h2 className="font-bold mb-1">💰 환전 신청</h2>
              <p className="text-xs text-gray-500 mb-3">※ 최소 10,000원 이상, 프로젝트 종료 후 신청 가능</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">프로젝트 코드 확인</label>
                  <input value={projectCode} onChange={(e) => { setProjectCode(e.target.value); if (e.target.value) getRequirements(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="프로젝트 코드 입력" />
                  {projectCode && (
                    <p className={`text-xs mt-1 ${projectStatus === 'COMPLETED' ? 'text-green-600' : 'text-red-500'}`}>
                      {projectStatus === 'COMPLETED' ? '✅ 환전 신청 가능 (프로젝트 종료)' : '❌ 프로젝트 진행 중 - 환전 불가'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">주민번호</label>
                  <input value={residentNumber} onChange={(e) => setResidentNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="주민번호 입력" />
                </div>
                <div>
                  <label className="text-sm font-medium">주소</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="주소 입력" />
                </div>
                <div>
                  <label className="text-sm font-medium">신청 금액</label>
                  <input type="number" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="금액 입력 (최소 10,000원)" />
                </div>
                {exchangeAmount && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p>원천징수 (3.3%): {Math.floor(Number(exchangeAmount) * 0.033).toLocaleString()}원</p>
                    <p className="font-medium">실수령액: {(Number(exchangeAmount) - Math.floor(Number(exchangeAmount) * 0.033)).toLocaleString()}원</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleExchange} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">환전 신청하기</button>
                  <button onClick={() => setShowExchange(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                </div>
              </div>
            </div>
          )}

          {/* 내 정보 수정 폼 - 버튼 바로 아래 */}
          {showMyInfo && (
            <div className="mt-4 border-t pt-4">
              <h2 className="font-bold mb-3">👤 회원정보 수정</h2>
              <div className="space-y-3">
                {[
                  { label: '이름', value: myName, setter: setMyName },
                  { label: '휴대전화', value: myMobile, setter: setMyMobile },
                  { label: '은행명', value: myBankName, setter: setMyBankName },
                  { label: '예금주', value: myAccountHolder, setter: setMyAccountHolder },
                  { label: '계좌번호', value: myAccountNumber, setter: setMyAccountNumber },
                  { label: '인스타그램 ID', value: myInstagram, setter: setMyInstagram },
                  { label: '유튜브 ID', value: myYoutube, setter: setMyYoutube },
                  { label: '틱톡 ID', value: myTiktok, setter: setMyTiktok },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium">새 비밀번호</label>
                  <input type="password" value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="변경할 경우만 입력" />
                </div><div className="flex gap-2">
                  <button onClick={handleUpdateMyInfo} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정하기</button>
                  <button onClick={() => setShowMyInfo(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('정말 계정을 삭제하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) return
                    await supabase.from('posts').delete().eq('member_id', userInfo?.id)
                    await supabase.from('settlements').delete().eq('member_id', userInfo?.id)
                    await supabase.from('comment_missions').delete().eq('member_id', userInfo?.id)
                    await supabase.from('participants').delete().eq('id', userInfo?.id)
                    await supabase.auth.signOut()
                    localStorage.removeItem('userInfo')
                    localStorage.removeItem('userRole')
                    alert('계정이 삭제됐습니다.')
                    router.push('/')
                  }}
                  className="w-full bg-red-500 text-white rounded-lg py-2 text-sm font-medium mt-2"
                >
                  계정 삭제
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 환전 신청 내역 */}
        {mySettlements.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">💰 환전 신청 내역</h2>
            <div className="space-y-2">
              {mySettlements.map((s) => (
                <div key={s.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{s.amount?.toLocaleString()}원</p>
                      <p className="text-xs text-gray-500">{new Date(s.requested_at).toLocaleDateString('ko-KR')}</p>
                      {s.memo && (
                        <div className="mt-1 bg-blue-50 rounded p-2">
                          <p className="text-xs text-blue-800 font-medium">📝 관리자 메모</p>
                          <p className="text-xs text-blue-700 mt-0.5">{s.memo}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {settlementStatusLabel(s.status)}
                      <p className="text-xs text-gray-500 mt-1">실수령: {s.net_amount?.toLocaleString() ?? 0}원</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 게시물 현황 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📊 나의 게시물 현황</h2>
            <button onClick={() => setShowPosts(!showPosts)} className="text-xs border rounded px-2 py-1">
              {showPosts ? '숨기기' : '금액 내역 보기'}
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setPostFilter('current')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'current' ? 'bg-blue-600 text-white' : 'border'}`}>진행 프로젝트</button>
            <button onClick={() => setPostFilter('all')} className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'all' ? 'bg-blue-600 text-white' : 'border'}`}>전체 내역</button>
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
                displayPosts.map((post) => {
                  const baseAmount = projectsMap[post.project_code]?.reward_per_post ?? 0
                  const myAmount = getLevelAmount(baseAmount, level)
                  return (
                    <div key={post.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                            {statusBadge(post.project_code)}
                          </div>
                          <p className="text-xs text-gray-400">{post.project_code}</p>
                          <a href={post.post_url} target="_blank" className="text-xs text-blue-500">링크 보기 →</a>
                        <button
                          onClick={() => {
                            const newUrl = prompt('새 URL을 입력해주세요:', post.post_url)
                            if (newUrl) {
                              supabase.from('posts').update({ post_url: newUrl }).eq('id', post.id)
                                .then(() => { alert('수정 완료!'); fetchMyPostsAndProjects(userInfo?.id) })
                            }
                          }}
                          className="text-xs text-orange-500 mt-1 block"
                        >
                          URL 수정
                        </button>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-sm font-medium text-blue-600">{myAmount.toLocaleString()}원</p>
                          <p className="text-xs text-gray-400">기본 {baseAmount.toLocaleString()}원</p>
                          <p className="text-xs text-gray-500">❤️ {post.likes_count?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* 프로젝트 기간 */}
        {projectInfo && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-2">📅 프로젝트 기간</h2>
            <p className="text-sm">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
            <p className="text-sm">종료예정일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}</p>
            {projectInfo.start_date && (
              <p className="text-sm">진행일수: {Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24))}일째</p>
            )}
            <p className={`text-xs mt-1 font-medium ${projectInfo.status === 'COMPLETED' ? 'text-gray-500' : projectInfo.status === 'ONGOING' ? 'text-green-600' : 'text-yellow-600'}`}>
              {projectInfo.status === 'COMPLETED' ? '✅ 종료된 프로젝트' : projectInfo.status === 'ONGOING' ? '🟢 진행중' : '⏸ 대기중'}
            </p>
          </div>
        )}

        {/* 프로젝트 리스트 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📋 프로젝트 목록</h2>
          {allProjects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">진행중인 프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {allProjects.map((project) => {
                const isSelected = projectCode.toLowerCase() === project.project_code.toLowerCase()
                const isStarted = !project.mission_date || new Date().toISOString().split('T')[0] >= project.mission_date
                const isFull = project.max_participants > 0 && participantCount >= project.max_participants
                return (
                  <div
                    key={project.id}
                    onClick={() => { setProjectCode(project.project_code); getRequirements(project.project_code) }}
                    className={`border rounded-lg p-3 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{project.product_content}</p>
                        <p className="text-xs text-gray-500">모집일: {project.mission_date ?? '미정'}</p>
                        {project.start_date && (
                          <p className="text-xs text-gray-500">
                            미션일: {project.start_date} 
                            {` (D-${Math.max(0, Math.ceil((new Date(project.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))})`}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isFull ? 'bg-red-100 text-red-700' :
                        isStarted ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {isStarted ? '진행중' : '예정'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 미션 제출 폼 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📸 미션 제출</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">의뢰인 식별 코드</label>
              <input value={projectCode} onChange={(e) => { setProjectCode(e.target.value); if (e.target.value) getRequirements(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: A_1" />
            </div>
            {requirements && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">📋 의뢰인 요청사항</p>
                <p className="text-sm text-blue-700 mt-1">{requirements}</p>
              </div>
            )}
            {projectInfo && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                {projectInfo.start_date && (
                  <p className="text-sm text-gray-700">📅 미션일: {projectInfo.start_date} {projectInfo.mission_date && `(모집일: ${projectInfo.mission_date})`}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">참여인원: {participantCount}/{projectInfo.max_participants || '∞'}</p>
                  {isJoined ? (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">참여중 ✅</span>
                  ) : projectInfo.max_participants > 0 && participantCount >= projectInfo.max_participants ? (
                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">모집종료</span>
                  ) : !projectInfo.start_date || new Date() < new Date(projectInfo.start_date) ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">모집 예정</span>
                  ) : (
                    <button onClick={handleJoin} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">참여하기</button>
                  )}
                </div>
              </div>
            )}
            {/* 미션 제출 폼 - 모집종료 아닐 때 + 미션 수행일 이후에만 표시 */}
            {projectInfo && isJoined && 
              (!projectInfo.mission_date || new Date().toISOString().split('T')[0] >= projectInfo.mission_date) && (
              <>
                <div>
                  <label className="text-sm font-medium">참여자 이름</label>
                  <input value={influencerName} onChange={(e) => setInfluencerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="이름 입력" />
                </div>
                <div>
                  <label className="text-sm font-medium">플랫폼 선택</label>
                  <select value={platform} onChange={(e) => {
                    setPlatform(e.target.value)
                    const accounts = JSON.parse(localStorage.getItem('snsAccounts') || '{}')
                    if (e.target.value === 'instagram') setSnsAccount(accounts.instagram ?? '')
                    else if (e.target.value === 'youtube') setSnsAccount(accounts.youtube ?? '')
                    else if (e.target.value === 'tiktok') setSnsAccount(accounts.tiktok ?? '')
                    else setSnsAccount('')
                  }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    <option value="">플랫폼을 선택해주세요</option>
                    <option value="instagram">인스타그램</option>
                    <option value="youtube">유튜브</option>
                    <option value="tiktok">틱톡</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">본인 SNS 계정</label>
                  <input value={snsAccount} onChange={(e) => setSnsAccount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="SNS 아이디" />
                </div>
                <div>
                  <label className="text-sm font-medium">미션 완료 링크 (URL)</label>
                  <input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="게시글 주소" />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400"
                >
                  {isSubmitting ? getPlatformLabel(platform) : '미션 제출하기'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* 댓글 미션 */}
        {projectCode && projectVideos && (projectVideos.shorts_url_1 || projectVideos.shorts_url_2 || projectVideos.playlist_url) && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">💬 댓글 미션</h2>
            <p className="text-xs text-gray-500 mb-3">유튜브 댓글을 작성하고 계정명을 입력해서 300원을 받으세요!</p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (!projectVideos) { alert('등록된 영상이 없어요.'); return }
                  const url = projectVideos.shorts_url_1 || projectVideos.shorts_url_2 || projectVideos.playlist_url
                  if (url) window.open(url, '_blank')
                  else alert('등록된 영상이 없어요.')
                }}
                className="w-full bg-red-600 text-white rounded-lg py-2 font-medium"
              >
                🎬 댓글 쓰러 가기
              </button>
              <div>
                <label className="text-sm font-medium">유튜브 계정명</label>
                <input value={youtubeHandle} onChange={(e) => setYoutubeHandle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="@계정명 또는 닉네임" />
              </div>
              <button
                onClick={async () => {
                  if (!projectVideos) { alert('등록된 영상이 없어요.'); return }
                  if (projectVideos.shorts_video_id_1) await handleCommentVerify(projectVideos.shorts_video_id_1, projectCode)
                  else if (projectVideos.shorts_video_id_2) await handleCommentVerify(projectVideos.shorts_video_id_2, projectCode)
                  else if (projectVideos.playlist_video_id) await handleCommentVerify(projectVideos.playlist_video_id, projectCode)
                  else alert('등록된 영상이 없어요.')
                }}
                disabled={isVerifying}
                className="w-full bg-orange-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400"
              >
                {isVerifying ? '인증 중...' : '댓글 인증 및 보상 받기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}