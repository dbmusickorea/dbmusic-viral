'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { encryptText, maskAccount, decryptText } from '../lib/crypto'

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
  const [myParticipations, setMyParticipations] = useState<any[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [unlockVideos, setUnlockVideos] = useState<any[]>([])
  const [unlockCommentCount, setUnlockCommentCount] = useState(0)
  const [showLevelGuide, setShowLevelGuide] = useState(false)
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [videoWatched, setVideoWatched] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isCover, setIsCover] = useState(false)
  const [myRankMap, setMyRankMap] = useState<{[key: string]: any}>({})
  const [coverReward, setCoverReward] = useState<number>(0)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    const accounts = JSON.parse(localStorage.getItem('snsAccounts') || '{}')
    setYoutubeHandle(accounts.youtube ?? '')
    setUserInfo(parsed)
    setUserRole(role ?? '')
    fetchParticipantInfo(parsed.id)
    fetchAvailableBalance(parsed.id)
    fetchMyPostsAndProjects(parsed.id)
    fetchMySettlements(parsed.id)
    fetchCommentMissions(parsed.id)
    fetchAllProjects()
    fetchUnlockVideos()
    fetchMyParticipations(parsed.id)
    fetchNotifications(String(parsed.id))
  }, [])

  const handleCommentVerify = async (videoId: string, projectCode: string) => {
    if (!youtubeHandle) { alert('유튜브 계정명을 입력해주세요.'); return }
    
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/comments?videoId=${videoId}&handle=${encodeURIComponent(youtubeHandle.toLowerCase())}`)
      const data = await response.json()
      
      if (data.found) {
        if (projectCode === '') {
          // 락 해제용 - 적립금 없이 카운트만 증가
          const { data: pData } = await supabase
            .from('participants')
            .select('is_locked, comment_count_for_unlock')
            .eq('id', userInfo?.id)
            .maybeSingle()
          
          if (pData?.is_locked) {
            // 락 해제용 미션 저장 (중복 방지)
            const alreadyUnlock = commentMissions.find(m => m.video_id === videoId)
            if (alreadyUnlock) { alert('이미 이 영상으로 인증하셨습니다.'); setIsVerifying(false); return }
            
            await supabase.from('comment_missions').insert({
              project_code: 'UNLOCK',
              member_id: userInfo?.id,
              video_id: videoId,
              youtube_handle: youtubeHandle.toLowerCase(),
              status: 'APPROVED',
              reward_amount: 0,
              comment_id: data.commentId ?? null
            })
            fetchCommentMissions(userInfo?.id)
            const newCount = (pData.comment_count_for_unlock ?? 0) + 1
            if (newCount >= 10) {
              await supabase.from('participants').update({ 
                is_locked: false, 
                comment_count_for_unlock: 0 
              }).eq('id', userInfo?.id)
              setIsLocked(false)
              alert('🎉 락이 해제됐어요! 이제 다시 미션에 참여할 수 있어요!')
            } else {
              await supabase.from('participants').update({ 
                comment_count_for_unlock: newCount 
              }).eq('id', userInfo?.id)
              setUnlockCommentCount(newCount)
              alert(`✅ 댓글 인증 완료! (${newCount}/10)`)
            }
          }
        } else {
          // 일반 댓글 미션 - 300원 적립
          const already = commentMissions.find(m => m.video_id === videoId && m.member_id === userInfo?.id)
          if (already) { alert('이미 이 영상으로 보상을 받으셨습니다.'); setIsVerifying(false); return }
          
          await supabase.from('comment_missions').insert({
            project_code: projectCode,
            member_id: userInfo?.id,
            video_id: videoId,
            youtube_handle: youtubeHandle.toLowerCase(),
            status: 'APPROVED',
            reward_amount: 300,
            comment_id: data.commentId ?? null
          })
          const newBalance = balance + 300
          await supabase.from('participants').update({ balance: newBalance }).eq('id', userInfo?.id)
          setBalance(newBalance)
          fetchCommentMissions(userInfo?.id)
          alert('✅ 댓글 인증 완료! 300원이 적립됐어요!')
        }
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

  const fetchUnlockVideos = async () => {
    const { data } = await supabase.from('unlock_videos').select('*')
    setUnlockVideos(data ?? [])
  }

  const fetchNotifications = async (id: string) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setUnreadCount(data?.filter(n => !n.is_read).length ?? 0)
  }

  const markAllRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', id).eq('is_read', false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: number) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const deleteAllNotifications = async (userId: string) => {
    await supabase.from('notifications').delete().eq('user_id', userId)
    setNotifications([])
    setUnreadCount(0)
  }

  const fetchMyParticipations = async (id: number) => {
    const { data } = await supabase
      .from('project_participants')
      .select('*')
      .eq('member_id', id)
      .order('joined_at', { ascending: false })
    
    if (data && data.length > 0) {
      const codes = data.map(p => p.project_code)
      const { data: projectData } = await supabase
        .from('projects')
        .select('project_code, product_content, start_date, mission_date, status')
        .in('project_code', codes)
      
      const merged = data.map(p => ({
        ...p,
        projects: projectData?.find(pd => pd.project_code.toLowerCase() === p.project_code.toLowerCase())
      }))
      setMyParticipations(merged)
      // 각 프로젝트 순위 가져오기
      for (const p of data) {
        fetchMyRank(p.project_code, id)
      }
    } else {
      setMyParticipations([])
    }
  }
  
  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const info = localStorage.getItem('userInfo')
    if (info) {
      const parsed = JSON.parse(info)
      await fetchParticipantInfo(parsed.id)
      await fetchMyPostsAndProjects(parsed.id)
      await fetchMySettlements(parsed.id)
      await fetchCommentMissions(parsed.id)
      await fetchAllProjects()
      await fetchMyParticipations(parsed.id)
      await fetchAvailableBalance(parsed.id)
      await fetchNotifications(String(parsed.id))
    }
    setIsRefreshing(false)
  }

  const fetchParticipantInfo = async (id: number) => {
    const { data } = await supabase.from('participants').select('balance, level, referral_code, name, instagram_id, youtube_id, tiktok_id, is_locked, comment_count_for_unlock, cover_reward').eq('id', id).maybeSingle()
    setCoverReward(data?.cover_reward ?? 0)
    setBalance(data?.balance ?? 0)
    setLevel(data?.level ?? 1)
    setReferralCode(data?.referral_code ?? '')
    setInfluencerName(data?.name ?? '')
    setIsLocked(data?.is_locked ?? false)
    setUnlockCommentCount(data?.comment_count_for_unlock ?? 0)
    if (data) {
      localStorage.setItem('snsAccounts', JSON.stringify({
        instagram: data.instagram_id ?? '',
        youtube: data.youtube_id ?? '',
        tiktok: data.tiktok_id ?? ''
      }))
    }
  }

  const fetchAvailableBalance = async (id: number) => {
    // 종료된 프로젝트 게시물 수익 (일반 게시물)
    const { data: posts } = await supabase.from('posts').select('project_code, is_cover').eq('member_id', id)
    let postIncome = 0
    if (posts && posts.length > 0) {
      const codes = [...new Set(posts.map(p => p.project_code))]
      const { data: completedProjects } = await supabase.from('projects').select('project_code, reward_per_post, end_date').in('project_code', codes).eq('status', 'COMPLETED')
      
      completedProjects?.forEach(project => {
        const projectPosts = posts.filter(p => p.project_code.toLowerCase() === project.project_code.toLowerCase())
        
        projectPosts.forEach(post => {
          if (post.is_cover) {
            // 커버영상은 종료 후 15일 이후
            if (project.end_date) {
              const endDate = new Date(project.end_date)
              const availableDate = new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
              if (new Date() >= availableDate) {
                postIncome += (level === 50 ? 10000 : 2500 + (level - 1) * 150)
              }
            }
          } else {
            // 일반 게시물은 프로젝트 종료 즉시
            postIncome += (level === 50 ? 10000 : 2500 + (level - 1) * 150)
          }
        })
      })
    }

    // 댓글 미션 수익
    const { data: missions } = await supabase.from('comment_missions').select('reward_amount').eq('member_id', id).eq('status', 'APPROVED')
    const commentIncome = missions?.reduce((sum, m) => sum + (m.reward_amount ?? 300), 0) ?? 0

    // 이미 환전 신청한 금액
    const { data: settlements } = await supabase.from('settlements').select('amount').eq('member_id', id).in('status', ['PENDING', 'APPROVED'])
    const settledAmount = settlements?.reduce((sum, s) => sum + (s.amount ?? 0), 0) ?? 0

    setAvailableBalance(Math.max(0, postIncome + commentIncome - settledAmount))
  }

  const fetchMyRank = async (projectCode: string, memberId: number) => {
    if (!projectCode) return
    const { data: posts } = await supabase
      .from('posts')
      .select('member_id, likes_count, influencer_name')
      .ilike('project_code', projectCode)
      .not('likes_count', 'is', null)
      .order('likes_count', { ascending: false })
    
    if (!posts || posts.length === 0) {
      setMyRankMap(prev => ({ ...prev, [projectCode]: null }))
      return
    }
    
    const myPost = posts.find(p => p.member_id === memberId)
    if (!myPost) {
      setMyRankMap(prev => ({ ...prev, [projectCode]: null }))
      return
    }
    
    const rank = posts.findIndex(p => p.member_id === memberId) + 1
    setMyRankMap(prev => ({ ...prev, [projectCode]: {
      rank,
      likes: myPost.likes_count,
      total: posts.length,
      isEligible: myPost.likes_count >= 1000
    }}))
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
      .select('requirements, status, start_date, end_date, reward_per_post, max_participants, mission_date, mission_time, required_posts')
      .ilike('project_code', code)
      .maybeSingle()
    setRequirements(data?.requirements ?? '')
    setProjectStatus(data?.status ?? '')
    setProjectInfo(data)
    const { data: videos } = await supabase.from('project_videos').select('*').ilike('project_code', code).maybeSingle()
    setProjectVideos(videos)
    // 참여 여부 및 인원 수 확인
    const { data: joinData } = await supabase.from('project_participants')
      .select('id, status').ilike('project_code', code).eq('member_id', userInfo?.id).maybeSingle()
    setIsJoined(!!joinData && joinData.status === 'ACTIVE')
    
    const { count } = await supabase.from('project_participants')
      .select('*', { count: 'exact', head: true }).ilike('project_code', code).eq('status', 'ACTIVE')
    setParticipantCount(count ?? 0)
    if (userInfo?.id) fetchMyRank(code, userInfo.id)
  }

  const handleJoin = async () => {
    if (!projectCode || !userInfo) return
    
    // 밴/락 여부 체크
    const { data: participantData } = await supabase
      .from('participants')
      .select('banned_until, is_locked')
      .eq('id', userInfo.id)
      .maybeSingle()
    
    // 락 여부 체크
    if (participantData?.is_locked) {
      alert('계정이 잠겼어요. 유튜브 댓글 10회 작성으로 잠금을 해제하세요!')
      return
    }

    // 밴 여부 체크
    if (participantData?.banned_until && new Date(participantData.banned_until) > new Date()) {
      const banDate = new Date(participantData.banned_until).toLocaleDateString('ko-KR')
      alert(`참여 제한 중이에요. ${banDate}까지 참여할 수 없어요.`)
      return
    }

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

  const getLevelAmount = (baseAmount: number, lv: number) => {
    return lv === 50 ? 10000 : 2500 + (lv - 1) * 150
  }

  const handleSubmit = async () => {
    if (isLocked) { alert('계정이 잠금 상태예요. 유튜브 댓글 10회 작성으로 잠금을 해제해주세요!'); return }
    // 게시물 수 제한 체크
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .ilike('project_code', projectCode)
      .eq('member_id', userInfo?.id)
    
    const maxPosts = projectInfo?.required_posts ?? 1
    if ((postCount ?? 0) >= maxPosts) {
      alert(`이미 ${maxPosts}개의 게시물을 제출했어요. 더 이상 제출할 수 없어요.`)
      setIsSubmitting(false)
      return
    }
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
      comments_count: commentsCount,
      is_cover: isCover,
      cover_status: isCover ? 'PENDING' : null
    })

    if (error) { setIsSubmitting(false); alert('미션 제출 실패!'); return }

    // 관리자에게 푸시 알림
    const { data: adminTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'admin')
    if (adminTokens && adminTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isCover ? '🎵 커버영상 신청이 왔어요!' : '📸 새 게시물이 등록됐어요!',
          body: `${influencerName}님이 ${projectCode} 프로젝트에 ${isCover ? '커버영상을' : '게시물을'} 등록했어요.`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }

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
      if (isCover) {
        alert(`미션 제출 완료! +${earnAmount.toLocaleString()}원 적립됐어요 🎉\n커버영상은 관리자 승인 후 별도 금액이 추가 지급됩니다.`)
      } else {
        alert(`미션 제출 완료! +${earnAmount.toLocaleString()}원 적립됐어요 🎉`)
      }
    } else {
      alert(isCover ? '미션 제출 완료!\n커버영상은 관리자 승인 후 별도 금액이 추가 지급됩니다.' : '미션 제출 완료!')
    }
    setIsCover(false)

    setIsSubmitting(false)
    fetchMyPostsAndProjects(userInfo?.id)
    setProjectCode(''); setInfluencerName(''); setSnsAccount(''); setPostUrl('')
    setPlatform('instagram'); setRequirements(''); setProjectStatus(''); setProjectInfo(null)
  }

  const handleExchange = async () => {
    if (isLocked) { alert('계정이 잠금 상태예요. 유튜브 댓글 10회 작성으로 잠금을 해제 후 환전 신청이 가능해요!'); return }
    if (!exchangeAmount) { alert('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    if (amount < 10000) { alert('최소 10,000원 이상부터 환전 신청 가능합니다.'); return }
    if (amount > availableBalance) { alert('환전 가능 금액을 초과합니다.'); return }

    // 예금주 이름 확인
    const { data: participantData } = await supabase.from('participants').select('name, account_holder').eq('id', userInfo?.id).maybeSingle()
    if (participantData?.account_holder && participantData?.name) {
      if (participantData.account_holder !== participantData.name) {
        alert('예금주와 가입자 이름이 일치하지 않아요. 본인 명의 계좌만 환전 신청 가능합니다.')
        return
      }
    }

    const taxAmount = Math.floor(amount * 0.033)
    const netAmount = amount - taxAmount
    
    // 주민번호 암호화
    const encryptedResident = residentNumber ? await encryptText(residentNumber) : ''
    
    const { error } = await supabase.from('settlements').insert({
      member_id: userInfo?.id, amount, tax_amount: taxAmount, net_amount: netAmount,
      resident_number: encryptedResident, address, status: 'PENDING'
    })
    if (error) { alert('환전 신청 실패!'); return }
    
    // 관리자에게 환전 신청 푸시
    const { data: adminTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'admin')
    if (adminTokens && adminTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '💰 환전 신청이 들어왔어요!',
          body: `${userInfo?.name}님이 ${amount.toLocaleString()}원 환전을 신청했어요.`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }

    alert('환전 신청 완료!')
    fetchMySettlements(userInfo?.id)
    fetchAvailableBalance(userInfo?.id)
    setShowExchange(false); setResidentNumber(''); setAddress(''); setExchangeAmount('')
  }

  const loadMyInfo = async () => {
    const { data } = await supabase.from('participants').select('*').eq('id', userInfo?.id).maybeSingle()
    setMyName(data?.name ?? ''); setMyMobile(data?.mobile ?? '')
    setMyBankName(data?.bank_name ?? ''); setMyAccountHolder(data?.account_holder ?? '')
    setMyInstagram(data?.instagram_id ?? '')
    setMyYoutube(data?.youtube_id ?? ''); setMyTiktok(data?.tiktok_id ?? '')
    
    // 계좌번호 복호화
    const decrypted = data?.account_number ? await decryptText(data.account_number) : ''
    setMyAccountNumber(decrypted)
    
    setShowMyInfo(true)
  }

  const handleUpdateMyInfo = async () => {
    if (myPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userInfo?.email,
        password: myCurrentPassword
      })
      if (authError) { alert('기존 비밀번호가 틀렸어요.'); return }
      await supabase.auth.updateUser({ password: myPassword })
    }

    // 계좌번호 암호화
    const encryptedAccount = myAccountNumber ? await encryptText(myAccountNumber) : ''

    const { error } = await supabase.from('participants').update({
      name: myName, mobile: myMobile, bank_name: myBankName,
      account_holder: myAccountHolder, account_number: encryptedAccount,
      instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok,
    }).eq('id', userInfo?.id)
    if (error) { alert('수정 실패!'); return }
    
    const updated = { 
      ...userInfo, 
      name: myName, mobile: myMobile, bank_name: myBankName,
      account_holder: myAccountHolder, account_number: encryptedAccount,
      instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok
    }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    localStorage.setItem('snsAccounts', JSON.stringify({
      instagram: myInstagram, youtube: myYoutube, tiktok: myTiktok
    }))
    
    alert('정보 수정 완료!')
    setShowMyInfo(false)
    setMyCurrentPassword('')
    setMyPassword('')
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
    <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500">
              {isRefreshing ? '🔄 새로고침 중...' : '↓ 놓으면 새로고침'}
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">더블비뮤직 체험단</h1>
            <button onClick={() => { 
              if (showNotifications) {
                markAllRead(String(userInfo?.id))
              } else {
                fetchNotifications(String(userInfo?.id))
              }
              setShowNotifications(!showNotifications)
            }} className="relative text-gray-500">
              <Bell size={22} className="text-gray-600" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
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

        {showNotifications && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold">알림 내역</h2>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button onClick={() => deleteAllNotifications(String(userInfo?.id))} className="text-xs text-red-400 border border-red-200 rounded px-2 py-1">전체 삭제</button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-xs text-gray-500 border rounded px-2 py-1">닫기</button>
              </div>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">알림이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`py-2 border-b border-gray-100 flex justify-between items-start ${!n.is_read ? 'bg-blue-50' : ''}`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <button onClick={() => deleteNotification(n.id)} className="text-gray-300 hover:text-red-400 ml-2 text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 컬럼 */}
          <div>
            {/* 적립금 + 레벨 + 추천인 코드 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">나의 적립금</p>
                  <p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()}원</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Lv.{level} ({level === 50 ? 10000 : (2500 + (level - 1) * 150).toLocaleString()}원)</span>
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
              <button onClick={() => setShowLevelGuide(!showLevelGuide)} className="w-full text-xs text-gray-500 border rounded-lg py-2 mt-2 mb-3">
                {showLevelGuide ? '레벨 안내 접기 ▲' : '레벨별 적립금 안내 ▼'}
              </button>
              {showLevelGuide && (
                <div className="mt-3 mb-3 border rounded-lg overflow-hidden">
                  <div className="bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
                    <p>🎯 추천인 1명 가입 시: <span className="font-bold">+150원 + 레벨 1 상승</span></p>
                    <p>👥 추천인의 하위 가입자 발생 시: <span className="font-bold">+50원</span></p>
                    <p>💰 레벨이 높을수록 게시물당 적립금이 올라가요!</p>
                    <p>⭐ 최대 적립금은 <span className="font-bold">10,000원</span>입니다.</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-3 text-left">레벨</th>
                        <th className="py-2 px-3 text-right">게시물당 적립금</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((lv) => (
                        <tr key={lv} className={`border-t ${level === lv ? 'bg-blue-50 font-bold' : ''}`}>
                          <td className="py-2 px-3">Lv.{lv} {level === lv ? '← 현재' : ''}</td>
                          <td className="py-2 px-3 text-right text-blue-600">
                            {lv === 50 ? '10,000원' : `${(2500 + (lv - 1) * 150).toLocaleString()}원`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {isLocked && (
                <div className="bg-red-50 rounded-2xl p-4 mb-4">
                  <h2 className="font-bold mb-2 text-red-600">⚠️ 계정 잠금 상태</h2>
                  <p className="text-xs text-red-500 mb-3">1개월간 미션 참여가 없어서 계정이 잠겼어요. 아래 영상에 댓글을 달아 잠금을 해제하세요!</p>
                  <p className="text-xs text-gray-500 mb-3">댓글 인증 현황: {unlockCommentCount}/10</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(unlockCommentCount / 10) * 100}%` }} />
                  </div>
                  {unlockVideos.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 락 해제 영상이 없어요. 관리자에게 문의하세요.</p>
                  ) : (
                    <div className="space-y-2">
                      {unlockVideos.map((v) => (
                        <div key={v.id} className="border rounded-lg p-2">
                          <a href={v.video_url} target="_blank" className="block text-xs text-blue-500 mb-2">🎬 {v.title} - 댓글 달러 가기 →</a>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">인증 계정: {youtubeHandle || '유튜브 ID 미등록'}</p>
                            <button 
                              onClick={() => handleCommentVerify(v.video_id, '')} 
                              disabled={isVerifying || !youtubeHandle || commentMissions.some(m => m.video_id === v.video_id)}
                              className="bg-red-500 text-white rounded px-2 py-1 text-xs disabled:bg-gray-400"
                            >
                              {commentMissions.some(m => m.video_id === v.video_id) ? '✅ 완료' : isVerifying ? '인증중...' : '인증'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setShowExchange(!showExchange); setShowMyInfo(false) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${showExchange ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`}>환전 신청</button>
                <button onClick={() => { if (!showMyInfo) loadMyInfo(); setShowMyInfo(!showMyInfo); setShowExchange(false) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${showMyInfo ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white'}`}>내 정보 보기</button>
              </div>

              {showExchange && (
                <div className="mt-4 border-t pt-4">
                  <h2 className="font-bold mb-1">💰 환전 신청</h2>
                  <p className="text-xs text-gray-500 mb-3">※ 최소 10,000원 이상 신청 가능</p>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500">환전 가능 금액</p>
                    <p className="text-xl font-bold text-blue-600">{availableBalance.toLocaleString()}원</p>
                    <p className="text-xs text-gray-400 mt-1">종료된 프로젝트 수익 + 댓글 미션 수익</p>
                  </div>
                  {coverReward > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500">커버영상 수익</p>
                      <p className="text-xl font-bold text-purple-600">{coverReward.toLocaleString()}원</p>
                      <p className="text-xs text-gray-400 mt-1">프로젝트 종료 후 15일 이후 환전 가능</p>
                    </div>
                  )}
                  <div className="space-y-3">
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
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
                        <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                    <p className="text-xs text-orange-500">⚠️ 본인 명의 계좌만 등록 가능합니다. 예금주명은 가입자 이름과 동일해야 해요.</p>
                    {[
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
                      <label className="text-sm font-medium">기존 비밀번호</label>
                      <input type="password" value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="기존 비밀번호 (변경시만)" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">새 비밀번호</label>
                      <input type="password" value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="새 비밀번호 (변경시만)" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUpdateMyInfo} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정하기</button>
                      <button onClick={() => setShowMyInfo(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                    </div>
                    <button onClick={async () => {
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
                    }} className="w-full bg-red-500 text-white rounded-lg py-2 text-sm font-medium mt-2">계정 삭제</button>
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
                <button onClick={() => setShowPosts(!showPosts)} className="text-xs border rounded px-2 py-1">{showPosts ? '숨기기' : '금액 내역 보기'}</button>
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
                              <button onClick={() => {
                                const newUrl = prompt('새 URL을 입력해주세요:', post.post_url)
                                if (newUrl) { supabase.from('posts').update({ post_url: newUrl }).eq('id', post.id).then(() => { alert('수정 완료!'); fetchMyPostsAndProjects(userInfo?.id) }) }
                              }} className="text-xs text-orange-500 mt-1 block">URL 수정</button>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-sm font-medium text-blue-600">{myAmount.toLocaleString()}원</p>
                              <p className="text-xs text-gray-400">기본 {baseAmount.toLocaleString()}원</p>
                              {post.is_cover && (
                                <p className="text-xs text-purple-600 font-medium">🎵 커버 +{coverReward.toLocaleString()}원</p>
                              )}
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
          </div>

          {/* 오른쪽 컬럼 */}
          <div>
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

            {/* 내 참여 현황 */}
            {myParticipations.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">✅ 내 참여 현황</h2>
                <div className="space-y-2">
                  {myParticipations.map((p) => (
                    <div key={p.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{p.projects?.product_content}</p>
                          <p className="text-xs text-gray-500">프로젝트 코드: {p.project_code}</p>
                          <p className="text-xs text-gray-500">미션일: {p.projects?.start_date ?? '미정'}</p>
                          {myRankMap[p.project_code] && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-blue-600">
                                {myRankMap[p.project_code].rank}위 / 전체 {myRankMap[p.project_code].total}명 중 {!myRankMap[p.project_code].isEligible ? '(좋아요 1,000건 미만 시상 제외)' : ''}
                              </p>
                              <p className="text-xs text-gray-500">❤️ {myRankMap[p.project_code].likes?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">참여중 ✅</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <div key={project.id} onClick={() => { setProjectCode(project.project_code); getRequirements(project.project_code) }} className={`border rounded-lg p-3 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{project.product_content}</p>
                            <p className="text-xs text-gray-500">모집일: {project.mission_date ?? '미정'}</p>
                            {project.start_date && (
                              <p className="text-xs text-gray-500">미션일: {project.start_date} {` (D-${Math.max(0, Math.ceil((new Date(project.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))})`}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${isFull ? 'bg-red-100 text-red-700' : isStarted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
                    {projectInfo?.required_posts && (
                      <p className="text-sm font-medium text-blue-800 mt-1">📝 요청 게시물 수: {projectInfo.required_posts}개</p>
                    )}
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
                {projectInfo && isJoined && (!projectInfo.mission_date || new Date().toISOString().split('T')[0] >= projectInfo.mission_date) && (
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
                    <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <input type="checkbox" checked={isCover} onChange={(e) => setIsCover(e.target.checked)} />
                      커버영상 제출 (관리자 승인 후 별도 금액 지급)
                    </label>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
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
                <p className="text-xs text-gray-500 mb-3">영상을 시청하고 댓글을 작성한 후 계정명을 입력해서 300원을 받으세요!</p>
                <p className="text-xs text-red-400 mb-3">⚠️ 댓글 삭제 시 적립금이 차감됩니다.</p>
                <div className="space-y-3">
                  {/* 영상 선택 버튼 */}
                  <div className="space-y-2">
                    {projectVideos.shorts_url_1 && (
                      <button onClick={() => {
                        setSelectedVideoIndex(1)
                        setVideoWatched(false)
                        window.open(projectVideos.shorts_url_1, '_blank')
                        setTimeout(() => { setVideoWatched(true) }, 30000)
                      }} className={`w-full rounded-lg py-2 font-medium text-sm ${selectedVideoIndex === 1 ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600'}`}>
                        {commentMissions.some(m => m.video_id === projectVideos.shorts_video_id_1) ? '✅ ' : '🎬 '}쇼츠 영상 1 보러가기
                      </button>
                    )}
                    {projectVideos.shorts_url_2 && (
                      <button onClick={() => {
                        setSelectedVideoIndex(2)
                        setVideoWatched(false)
                        window.open(projectVideos.shorts_url_2, '_blank')
                        setTimeout(() => { setVideoWatched(true) }, 30000)
                      }} className={`w-full rounded-lg py-2 font-medium text-sm ${selectedVideoIndex === 2 ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600'}`}>
                        {commentMissions.some(m => m.video_id === projectVideos.shorts_video_id_2) ? '✅ ' : '🎬 '}쇼츠 영상 2 보러가기
                      </button>
                    )}
                    {projectVideos.playlist_url && (
                      <button onClick={() => {
                        setSelectedVideoIndex(3)
                        setVideoWatched(false)
                        window.open(projectVideos.playlist_url, '_blank')
                        setTimeout(() => { setVideoWatched(true) }, 30000)
                      }} className={`w-full rounded-lg py-2 font-medium text-sm ${selectedVideoIndex === 3 ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600'}`}>
                        {commentMissions.some(m => m.video_id === projectVideos.playlist_video_id) ? '✅ ' : '🎵 '}플레이리스트 보러가기
                      </button>
                    )}
                  </div>

                  {selectedVideoIndex && !videoWatched && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 text-center">
                        ⏱ 30초 이상 시청하셔야 인증창이 활성화 됩니다.
                        시청 후 댓글을 작성하고 돌아오세요!
                      </p>
                    </div>
                  )}

                  {selectedVideoIndex && videoWatched && (
                    <p className="text-xs text-green-600 text-center font-medium">✅ 시청 완료! 아래에서 인증해주세요.</p>
                  )}

                  <div>
                    <label className="text-sm font-medium">유튜브 계정명</label>
                    <input value={youtubeHandle} onChange={(e) => setYoutubeHandle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="@계정명 또는 닉네임" />
                  </div>
                  <button onClick={async () => {
                    if (!videoWatched) { alert('먼저 영상을 시청해주세요!'); return }
                    if (!projectVideos) { alert('등록된 영상이 없어요.'); return }
                    const videoId = selectedVideoIndex === 1 ? projectVideos.shorts_video_id_1 :
                      selectedVideoIndex === 2 ? projectVideos.shorts_video_id_2 :
                      projectVideos.playlist_video_id
                    if (videoId) await handleCommentVerify(videoId, projectCode)
                    else alert('등록된 영상이 없어요.')
                  }} disabled={isVerifying || !videoWatched} className="w-full bg-orange-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
                    {isVerifying ? '인증 중...' : !videoWatched ? '영상 시청 후 인증 가능' : '댓글 인증 및 보상 받기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
        </div>
      </div>
    </div>
  )
}