'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

export default function Page1() {
  const [projects, setProjects] = useState<any[]>([])
  const [shortsUrl1, setShortsUrl1] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [missionDate, setMissionDate] = useState('')
  const [missionTime, setMissionTime] = useState('')
  const [shortsUrl2, setShortsUrl2] = useState('')
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [clientName, setClientName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [projectPrefix, setProjectPrefix] = useState('')
  const [productContent, setProductContent] = useState('')
  const [requirements, setRequirements] = useState('')
  const [status, setStatus] = useState('ONGOING')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rewardPerPost, setRewardPerPost] = useState('2500')
  const [optionName, setOptionName] = useState('')
  const [optionPrice, setOptionPrice] = useState('')
  const [isUpdatingLikes, setIsUpdatingLikes] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [updatingPostId, setUpdatingPostId] = useState<number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [showProductManager, setShowProductManager] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [isSendingPush, setIsSendingPush] = useState(false)
  const [clientRequests, setClientRequests] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [unlockVideos, setUnlockVideos] = useState<any[]>([])
  const [newUnlockUrl, setNewUnlockUrl] = useState('')
  const [requiredPosts, setRequiredPosts] = useState('1')
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<string>('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [coverPosts, setCoverPosts] = useState<any[]>([])
  const [coverRewardAmount, setCoverRewardAmount] = useState('')
  const [topRanker, setTopRanker] = useState<any>(null)
  const [monitoringExtension, setMonitoringExtension] = useState(0)
  const [coverVideoCount, setCoverVideoCount] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [projectPage, setProjectPage] = useState(0)
  const [requestPage, setRequestPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left')
  const [adminPostPage, setAdminPostPage] = useState(0)
  const [participantPage, setParticipantPage] = useState(0)
  const [songTitle, setSongTitle] = useState('')
  const [pushTarget, setPushTarget] = useState<'all' | 'participant' | 'client'>('all')
  const [instagramAudioId, setInstagramAudioId] = useState('')
  const [tiktokAudioId, setTiktokAudioId] = useState('')
  const [projectLinks, setProjectLinks] = useState<any[]>([{ platform: '', url: '', isNew: true }])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const PAGE_SIZE = 5
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    const userInfo = localStorage.getItem('userInfo')
    const loadData = async () => {
      await Promise.all([
        fetchProjects(),
        fetchProducts(),
        fetchClients(),
        fetchClientRequests(),
        fetchUnlockVideos(),
        fetchCoverPosts(),
      ])
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        fetchNotifications(String(parsed.id))
      }
    }
    loadData()
  }, [])

  const fetchProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data ?? [])
  }

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data ?? [])
  }

  const fetchClients = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setClients(data ?? [])
  }

  const fetchClientRequests = async () => {
    const res = await fetch('/api/client_requests')
    const data = await res.json()
    setClientRequests(data ?? [])
  }

  const fetchUnlockVideos = async () => {
    const res = await fetch('/api/unlock_videos')
    const data = await res.json()
    setUnlockVideos(data ?? [])
  }

  const fetchTopRanker = async (projectCode: string) => {
    const res = await fetch(`/api/posts?project_code=${projectCode}`)
    const allPosts = await res.json()
    const posts = allPosts
      ?.filter((p: any) => p.likes_count !== null && p.likes_count >= 1000)
      ?.sort((a: any, b: any) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
    
    if (!posts || posts.length === 0) { setTopRanker(null); return }
    setTopRanker(posts[0])
  }

  const handleApproveCover = async (post: any) => {
    if (!coverRewardAmount) { alert('지급할 금액을 입력해주세요.'); return }
    const reward = Number(coverRewardAmount)
    
    // 커버영상 승인 처리
    await fetch(`/api/posts?id=${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_status: 'APPROVED' })
    })
    
    // 적립금 추가
    const participantRes = await fetch(`/api/participants?ids=${post.member_id}`)
    const participants = await participantRes.json()
    const participant = participants?.[0]
    if (participant) {
      await fetch(`/api/participants?id=${post.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: (participant.balance ?? 0) + reward,
          cover_reward: reward
        })
      })
    }

    // 푸시 알림
    const tokensRes = await fetch(`/api/push_tokens?user_id=${String(post.member_id)}`)
    const tokens = await tokensRes.json()
    if (tokens && tokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎵 커버영상 승인됐어요!',
          body: `커버영상이 승인되어 ${reward.toLocaleString()}P이 추가 지급됐어요.`,
          tokens: tokens.map((t: any) => t.token),
          userIds: tokens.map((t: any) => t.user_id)
        })
      })
    }
    
    alert('승인 완료!')
    setCoverRewardAmount('')
    fetchCoverPosts()
  }

  const handleRejectCover = async (postId: number) => {
    await fetch(`/api/posts?id=${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_status: 'REJECTED' })
    })
    alert('거절 완료!')
    fetchCoverPosts()
  }

  const handleAddUnlockVideo = async () => {
    if (!newUnlockUrl) { alert('URL을 입력해주세요.'); return }
    const match = newUnlockUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)
    const videoId = match?.[1] ?? ''
    if (!videoId) { alert('유효한 유튜브 URL을 입력해주세요.'); return }
    const res = await fetch('/api/unlock_videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: newUnlockUrl, video_id: extractVideoId(newUnlockUrl), title: '락 해제용 영상' })
    })
    if (!res.ok) { alert('등록 실패!'); return }
    setNewUnlockUrl('')
    fetchUnlockVideos()
    alert('등록 완료!')
  }

  const handleAddProduct = async () => {
    if (!newProduct) { alert('상품명을 입력해주세요.'); return }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProduct, price: Number(newProductPrice) || 0 })
    })
    if (!res.ok) { alert('등록 실패!'); return }
    setNewProduct(''); setNewProductPrice('')
    fetchProducts()
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const fetchCoverPosts = async () => {
    const res = await fetch('/api/posts?is_cover=true')
    const data = await res.json()
    if (data && data.length > 0) {
      const memberIds = data.map((p: any) => p.member_id).join(',')
      const participantRes = await fetch(`/api/participants?ids=${memberIds}`)
      const participantData = await participantRes.json()
      const merged = data.map((p: any) => ({
        ...p,
        participants: participantData?.find((pd: any) => pd.id === p.member_id)
      }))
      setCoverPosts(merged)
    } else {
      setCoverPosts([])
    }
  }

  const fetchPosts = async (code: string) => {
    const res = await fetch(`/api/posts?project_code=${code}`)
    const data = await res.json()
    setPosts(data ?? [])
  }

  const fetchParticipants = async (code: string) => {
    const res = await fetch(`/api/project_participants?project_code=${code}&status=ACTIVE`)
    const data = await res.json()
    
    if (data && data.length > 0) {
      const memberIds = data.map((p: any) => p.member_id).join(',')
      const participantRes = await fetch(`/api/participants?ids=${memberIds}`)
      const participantData = await participantRes.json()
      
      const merged = data.map((p: any) => ({
        ...p,
        participants: participantData?.find((pd: any) => pd.id === p.member_id)
      }))
      setParticipants(merged)
    } else {
      setParticipants([])
    }
  }

  const handleCancelParticipation = async (participantId: number, name: string, memberId: number) => {
    const reason = prompt(`${name}님의 참여를 취소합니다.\n※ 제출한 게시물 삭제 및 포인트가 회수됩니다.\n\n취소 사유를 입력하세요:`)
    if (reason === null) return
    if (!reason.trim()) { alert('취소 사유를 입력해주세요.'); return }

    const res = await fetch(`/api/project_participants?id=${participantId}`, { method: 'DELETE' })
    if (res.ok) {
      const result = await res.json()

      // 1) 취소된 체험단에게 푸시
      const tokensRes = await fetch(`/api/push_tokens?user_id=${String(memberId)}`)
      const tokens = await tokensRes.json()
      if (tokens && tokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '⚠️ 프로젝트 참여가 취소되었습니다',
            body: `[${selectedProject?.project_code}] 참여취소 사유: ${reason}`,
            tokens: tokens.map((t: any) => t.token),
            userIds: tokens.map((t: any) => t.user_id)
          })
        })
      }

      // 2) 미참여 체험단에게 공석 안내 푸시
      if (selectedProject) {
        const allTokensRes = await fetch('/api/push_tokens?user_role=participant')
        const allTokens = await allTokensRes.json()
        const participantMemberIds = participants.map((p: any) => String(p.member_id))
        const nonParticipantTokens = allTokens.filter((t: any) => !participantMemberIds.includes(String(t.user_id)) && String(t.user_id) !== String(memberId))
        if (nonParticipantTokens.length > 0) {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎵 참여 가능한 프로젝트가 있어요!',
              body: `[${selectedProject.project_code}] 프로젝트에 참여 공석이 생겼습니다. 지금 참여해보세요!`,
              tokens: nonParticipantTokens.map((t: any) => t.token),
              userIds: nonParticipantTokens.map((t: any) => t.user_id)
            })
          })
        }
      }

      alert(`${name}님 참여취소 완료\n- 삭제된 게시물: ${result.postsDeleted}건\n- 회수 포인트: ${result.deducted?.toLocaleString() ?? 0}P\n- 푸시 알림 발송됨`)
      if (selectedProject) {
        fetchParticipants(selectedProject.project_code)
        fetchPosts(selectedProject.project_code)
      }
    } else {
      alert('참여취소 실패')
    }
  }

  // 알파벳 입력 시 자동으로 프로젝트 코드 생성
  const handlePrefixChange = async (prefix: string) => {
    const upper = prefix.toUpperCase().replace(/[^A-Z]/g, '')
    setProjectPrefix(upper)
    if (!upper) { setProjectCode(''); return }

    const res = await fetch(`/api/projects?prefix=${upper}`)
    const data = await res.json()
    const nextNum = (data?.length ?? 0) + 1
    setProjectCode(`${upper}_${nextNum}`)
  }

  const handleSelectProject = (project: any) => {
    if (selectedProject?.id === project.id) {
      clearForm()
      return
    }
    setSelectedProject(project)
    setActiveTab('right')
    setClientName(project.client_name ?? '')
    setProjectCode(project.project_code ?? '')
    setProjectPrefix(project.project_code?.split('_')[0] ?? '')
    setProductContent(project.product_content ?? '')
    setSongTitle(project.song_title ?? '')
    setInstagramAudioId(project.instagram_audio_id ?? '')
    setTiktokAudioId(project.tiktok_audio_id ?? '')
    setRequirements(project.requirements ?? '')
    setStatus(project.status ?? 'ONGOING')
    setStartDate(project.start_date ? project.start_date.substring(0, 10) : '')
    setEndDate(project.end_date ? project.end_date.substring(0, 10) : '')
    setRewardPerPost(project.reward_per_post ?? '')
    setOptionName(project.option_name ?? '')
    setOptionPrice(project.option_price ?? '')
    setMonitoringExtension(project.monitoring_extension ?? 0)
    setCoverVideoCount(project.cover_video_count ?? 0)
    setSelectedClientId(project.client_id ?? '')
    setShortsUrl1('')
    setShortsUrl2('')
    setPlaylistUrl('')
    setStartTime(project.start_time ?? '')
    setEndTime(project.end_time ?? '')
    setMaxParticipants(project.max_participants ?? '')
    setMissionDate(project.mission_date ?? '')
    setMissionTime(project.mission_time ?? '')
    setRequiredPosts(String(project.required_posts ?? 1))
    setRefreshInterval(String(project.refresh_interval ?? ''))
    fetchPosts(project.project_code)
    fetch(`/api/project_videos?project_code=${project.project_code}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setShortsUrl1(data.shorts_url_1 ?? '')
          setShortsUrl2(data.shorts_url_2 ?? '')
          setPlaylistUrl(data.playlist_url ?? '')
        }
      })
    fetchParticipants(project.project_code)
    fetchTopRanker(project.project_code)
    fetch(`/api/project_links?project_code=${project.project_code}`)
      .then(res => res.json())
      .then(data => {
        setProjectLinks([{ platform: '', url: '', isNew: true }])
      })
  }

  const getSelectedProductPrice = () => {
    const product = products.find(p => p.name === productContent)
    return product?.price ?? 0
  }

  const getTotalCost = () => {
    const productPrice = getSelectedProductPrice()
    const option = Number(optionPrice) || 0
    const monitoring = monitoringExtension === 15 ? 200000 : monitoringExtension === 30 ? 400000 : monitoringExtension === 45 ? 600000 : 0
    const traffic = refreshInterval === '6' ? 150000 : refreshInterval === '3' ? 300000 : refreshInterval === '1' ? 800000 : 0
    const cover = coverVideoCount === 10 ? 1500000 : coverVideoCount === 20 ? 3000000 : coverVideoCount === 30 ? 4500000 : 0
    const extraPosts = Number(requiredPosts) === 2 ? Math.floor(productPrice * 0.5) : 0
    return productPrice + option + monitoring + traffic + cover + extraPosts
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)
    return match?.[1] ?? ''
  }

  const saveProjectVideos = async (projectCode: string) => {
    const existingRes = await fetch(`/api/project_videos?project_code=${projectCode}`)
    const existing = await existingRes.json()
    const data = {
      project_code: projectCode,
      shorts_url_1: shortsUrl1 || null,
      shorts_video_id_1: shortsUrl1 ? extractVideoId(shortsUrl1) : null,
      shorts_url_2: shortsUrl2 || null,
      shorts_video_id_2: shortsUrl2 ? extractVideoId(shortsUrl2) : null,
      playlist_url: playlistUrl || null,
      playlist_video_id: playlistUrl ? extractVideoId(playlistUrl) : null,
    }
    if (existing) {
      await fetch(`/api/project_videos?project_code=${projectCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } else {
      await fetch('/api/project_videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    }
  }

  const saveProjectLinks = async (projectCode: string) => {
    for (const link of projectLinks) {
      if (!link.url) continue
      
      const videoId = extractVideoId(link.url)
      
      if (link.isNew) {
        await fetch('/api/project_links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_code: projectCode,
            platform: link.platform,
            url: link.url,
            video_id: videoId || null
          })
        })
      } else if (link.id) {
        await fetch(`/api/project_links?id=${link.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: link.platform,
            url: link.url,
            video_id: videoId || null
          })
        })
      }
    }
    // 저장 후 최신 데이터 다시 불러오기
    const res = await fetch(`/api/project_links?project_code=${projectCode}`)
    const data = await res.json()
    setProjectLinks(data ?? [])
  }

  const handleInsert = async () => {
    if (!projectCode) { alert('프로젝트 코드를 입력해주세요.'); return }
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_code: projectCode.toUpperCase(),
        client_name: clientName,
        product_content: productContent,
        song_title: songTitle,
        instagram_audio_id: instagramAudioId || null,
        tiktok_audio_id: tiktokAudioId || null,
        requirements,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        reward_per_post: Number(rewardPerPost) || 2500,
        max_participants: Number(maxParticipants) || 0,
        mission_date: missionDate || null,
        mission_time: missionTime || null,
        option_name: optionName || null,
        option_price: Number(optionPrice) || null,
        client_id: selectedClientId || null,
        required_posts: Number(requiredPosts) || 1,
        refresh_interval: refreshInterval ? Number(refreshInterval) : null,
        monitoring_extension: Number(monitoringExtension) || 0,
        cover_video_count: Number(coverVideoCount) || 0,
        start_time: startTime || null,
        end_time: endTime || null,
      })
    })
    if (!res.ok) { alert('등록 실패!'); return }
    if (selectedClientId) {
      await fetch(`/api/users?client_id=${selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_code: projectCode.toUpperCase() })
      })
    }
    await saveProjectVideos(projectCode.toUpperCase())
    await saveProjectLinks(projectCode.toUpperCase())
    
    // 체험단 전체에게 푸시 알림 발송
    const participantTokensRes = await fetch('/api/push_tokens?user_role=participant,client')
    const participantTokens = await participantTokensRes.json()
    if (participantTokens && participantTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎵 새 프로젝트가 등록됐어요!',
          body: `${productContent} 프로젝트가 등록됐어요. 모집일: ${startDate || '미정'}. 앱에서 확인해보세요!`,
          tokens: participantTokens.map((t: any) => t.token),
          userIds: participantTokens.map((t: any) => t.user_id)
        })
      })
    }
    alert('등록 완료!')
    fetchProjects()
    fetchClients()
    clearForm()
  }

  const handleUpdate = async () => {
    const res = await fetch(`/api/projects?project_code=${selectedProject.project_code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        product_content: productContent,
        song_title: songTitle,
        instagram_audio_id: instagramAudioId || null,
        tiktok_audio_id: tiktokAudioId || null,
        requirements,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        reward_per_post: Number(rewardPerPost) || 2500,
        max_participants: Number(maxParticipants) || 0,
        mission_date: missionDate || null,
        mission_time: missionTime || null,
        option_name: optionName || null,
        option_price: Number(optionPrice) || null,
        client_id: selectedClientId || null,
        required_posts: Number(requiredPosts) || 1,
        refresh_interval: refreshInterval ? Number(refreshInterval) : null,
        monitoring_extension: Number(monitoringExtension) || 0,
        cover_video_count: Number(coverVideoCount) || 0,
        start_time: startTime || null,
        end_time: endTime || null,
      })
    })
    if (!res.ok) { alert('수정 실패!'); return }
    if (selectedClientId) {
      await fetch(`/api/users?client_id=${selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_code: projectCode.toUpperCase() })
      })
    }
    await saveProjectLinks(projectCode.toUpperCase())

    // 프로젝트 상태 변경 시 푸시
    if (status === 'COMPLETED') {
      const joinedRes = await fetch(`/api/project_participants?project_code=${projectCode}`)
      const joinedTokens = await joinedRes.json()
      if (joinedTokens && joinedTokens.length > 0) {
        const memberIds = joinedTokens.map((j: any) => String(j.member_id))
        const tokensRes = await fetch(`/api/push_tokens?user_ids=${memberIds.join(',')}`)
        const tokens = await tokensRes.json()
        if (tokens && tokens.length > 0) {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '📢 프로젝트가 종료됐어요!',
              body: `${productContent} 프로젝트가 종료됐어요. 환전 신청을 확인해보세요!`,
              tokens: tokens.map((t: any) => t.token),
              userIds: tokens.map((t: any) => t.user_id)
            })
          })
        }
      }
      // 의뢰인에게 종료 알림
      const clientTokensRes = await fetch('/api/push_tokens?user_role=client')
      const clientTokens = await clientTokensRes.json()
      if (clientTokens && clientTokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '📢 프로젝트가 종료됐어요!',
            body: `${productContent} 프로젝트가 종료됐어요. 결과보고서를 확인해보세요!`,
            tokens: clientTokens.map((t: any) => t.token),
            userIds: clientTokens.map((t: any) => t.user_id)
          })
        })
      }
    }

    alert('수정 완료!')
    fetchProjects()
    fetchClients()
  }

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) { alert('제목과 내용을 입력해주세요.'); return }
    setIsSendingPush(true)
    
    const url = pushTarget === 'all' 
      ? '/api/push_tokens' 
      : pushTarget === 'participant'
      ? '/api/push_tokens?user_role=participant'
      : '/api/push_tokens?user_role=client'
    
    const res = await fetch(url)
    const tokens = await res.json()
    if (!tokens || tokens.length === 0) { alert('등록된 푸시 토큰이 없어요.'); setIsSendingPush(false); return }
    
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: pushTitle,
        body: pushBody,
        tokens: tokens.map((t: any) => t.token),
        userIds: tokens.map((t: any) => t.user_id)
      })
    })
    const data = await response.json()
    if (data.success) {
      alert(`✅ 푸시 알림 발송 완료! ${tokens.length}명에게 발송됐어요.`)
      setPushTitle('')
      setPushBody('')
    } else {
      alert('발송 실패!')
    }
    setIsSendingPush(false)
  }

  const getInstagramStats = async (url: string) => {
    try {
      const shortcode = url.split('/p/')[1]?.split('/')[0]
      if (!shortcode) return null
      const response = await fetch(`/api/instagram?shortcode=${shortcode}`)
      const data = await response.json()
      return { likes: data.like_count ?? 0, comments: data.comment_count ?? 0 }
    } catch { return null }
  }

  const getYoutubeStats = async (url: string) => {
    try {
      const response = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return { likes: data.likes ?? 0, comments: data.comments ?? 0 }
    } catch { return null }
  }

  const getTiktokStats = async (url: string) => {
    try {
      const response = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      return { likes: data.likes ?? 0, comments: data.comments ?? 0 }
    } catch { return null }
  }

  const handleUpdateProjectLikes = async () => {
    if (!selectedProject) return
    setIsUpdatingLikes(true)
    const res = await fetch(`/api/posts?project_code=${selectedProject.project_code}`)
    const projectPosts = await res.json()
    if (!projectPosts) { setIsUpdatingLikes(false); return }

    for (const post of projectPosts) {
      try {
        let stats = null
        if (post.platform === 'instagram') {
          stats = await getInstagramStats(post.post_url)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else if (post.platform === 'youtube') {
          stats = await getYoutubeStats(post.post_url)
        } else if (post.platform === 'tiktok') {
          stats = await getTiktokStats(post.post_url)
        }
        if (stats) {
          await fetch(`/api/posts?id=${post.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              likes_count: stats.likes,
              comments_count: stats.comments
            })
          })
        }
      } catch { continue }
    }

    setIsUpdatingLikes(false)
    alert('갱신 완료!')
    fetchPosts(selectedProject.project_code)
  }

  const handleUpdateSingleLike = async (post: any) => {
    if (!['instagram', 'youtube', 'tiktok'].includes(post.platform)) {
      alert('인스타그램/유튜브/틱톡 게시물만 갱신 가능해요!')
      return
    }
    setUpdatingPostId(post.id)
    try {
      let stats = null
      if (post.platform === 'instagram') stats = await getInstagramStats(post.post_url)
      else if (post.platform === 'youtube') stats = await getYoutubeStats(post.post_url)
      else if (post.platform === 'tiktok') stats = await getTiktokStats(post.post_url)

      if (stats) {
        await fetch(`/api/posts?id=${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            likes_count: stats.likes,
            comments_count: stats.comments
          })
        })
        fetchPosts(selectedProject.project_code)
        alert('갱신 완료!')
      }
    } catch { alert('갱신 실패!') }
    setUpdatingPostId(null)
  }

  const clearForm = () => {
    setSelectedProject(null)
    setClientName(''); setProjectCode(''); setProjectPrefix(''); setProductContent('')
    setRequirements(''); setStatus('ONGOING'); setStartDate('')
    setEndDate(''); setRewardPerPost(''); setOptionName(''); setOptionPrice('')
    setSelectedClientId(''); setClientSearch('')
    setSongTitle('')
    setInstagramAudioId('')
    setTiktokAudioId('')
    setPosts([])
    setStartTime('')
    setEndTime('')
    setMaxParticipants(''); setMissionDate(''); setMissionTime('')
    setShortsUrl1(''); setShortsUrl2(''); setPlaylistUrl('')
    setRequiredPosts('1')
    setRefreshInterval('')
    setProjectLinks([{ platform: 'youtube_shorts', url: '', isNew: true }])
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await fetchProjects()
    await fetchProducts()
    await fetchClients()
    await fetchClientRequests()
    await fetchUnlockVideos()
    await fetchCoverPosts()
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      await fetchNotifications(String(parsed.id))
    }
    setIsRefreshing(false)
  }

  const fetchNotifications = async (id: string) => {
    const res = await fetch(`/api/notifications?user_id=${id}`)
    const data = await res.json()
    setNotifications(data ?? [])
    setUnreadCount(data?.filter((n: any) => !n.is_read).length ?? 0)
  }

  const markAllRead = async (id: string) => {
    await fetch(`/api/notifications?user_id=${id}`, { method: 'PATCH' })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteAllNotifications = async (userId: string) => {
    await fetch(`/api/notifications?user_id=${userId}`, { method: 'DELETE' })
    setNotifications([])
    setUnreadCount(0)
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-base mt-1 box-border"
  const dateInputStyle = { maxWidth: '100%', boxSizing: 'border-box' as const }

  const filteredClients = clients.filter(c =>
    c.name?.includes(clientSearch) ||
    c.company?.includes(clientSearch) ||
    c.artist?.includes(clientSearch) ||
    c.client_id?.includes(clientSearch)
  )

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
            <h1 className="text-xl font-bold">프로젝트 관리</h1>
            <div className="relative">
              <button onClick={() => { 
                if (showNotifications) {
                  const userInfo = localStorage.getItem('userInfo')
                  if (userInfo) markAllRead(String(JSON.parse(userInfo).id))
                } else {
                  const userInfo = localStorage.getItem('userInfo')
                  if (userInfo) fetchNotifications(String(JSON.parse(userInfo).id))
                }
                setShowNotifications(!showNotifications)
              }} className="relative text-gray-500">
                <Bell size={22} className="text-gray-600" strokeWidth={1.5} /> 
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-8 z-50 w-80 max-h-[70vh] overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold">알림 내역</h2>
                      <div className="flex gap-2">
                        {notifications.length > 0 && (
                          <button onClick={() => deleteAllNotifications(String(JSON.parse(localStorage.getItem('userInfo') || '{}').id))} className="text-xs text-red-400 border border-red-200 rounded px-2 py-1">전체 삭제</button>
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
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 mb-2">
            <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
            <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
            <button onClick={() => router.push('/cover')} className="flex-1 text-xs border rounded py-2 text-center">커버</button>
          </div>
        </div>

        {selectedProject && topRanker && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-4">
            <p className="text-sm font-medium text-yellow-800">🏆 1등: {topRanker.influencer_name}</p>
            <p className="text-xs text-yellow-700">❤️ {topRanker.likes_count?.toLocaleString()}</p>
            <a href={topRanker.post_url} target="_blank" className="text-xs text-blue-600">링크 →</a>
          </div>
        )}

        {/* 모바일 탭 */}
        <div className="md:hidden flex mb-4 border-b">
          <button onClick={() => setActiveTab('left')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'left' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📋 프로젝트</button>
          <button onClick={() => setActiveTab('right')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'right' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>⚙️ 관리</button>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 컬럼 */}
          <div className={`${activeTab === 'left' ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">📦 상품 사전 등록</h2>
                <button onClick={() => setShowProductManager(!showProductManager)} className="text-xs border rounded px-2 py-1">{showProductManager ? '닫기' : '관리'}</button>
              </div>
              {showProductManager && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="상품명" />
                    <input type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="w-28 border rounded-lg px-3 py-2 text-sm" placeholder="가격" />
                    <button onClick={handleAddProduct} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                  </div>
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">등록된 상품이 없습니다.</p>
                  ) : (
                    <div className="space-y-1">
                      {products.map((p) => (
                        <div key={p.id} className="flex justify-between items-center border rounded-lg px-3 py-2">
                          <p className="text-sm">{p.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-blue-600">{p.price?.toLocaleString()}P</p>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500">삭제</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">프로젝트 목록</h2>
                <div className="flex gap-2 text-xs">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기 {projects.filter(p => p.status === 'PAUSED').length}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">진행 {projects.filter(p => p.status === 'ONGOING').length}</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">완료 {projects.filter(p => p.status === 'COMPLETED').length}</span>
                </div>
              </div>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">프로젝트가 없습니다.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {projects.slice(projectPage * PAGE_SIZE, (projectPage + 1) * PAGE_SIZE).map((project) => (
                      <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{project.client_name} / {project.song_title ?? project.product_content}</p>
                            <p className="text-xs text-gray-400">프로젝트 코드: {project.project_code}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                            {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setProjectPage(p => Math.max(0, p - 1))} disabled={projectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                    <span className="text-xs text-gray-500">{projectPage + 1} / {Math.ceil(projects.length / PAGE_SIZE)}</span>
                    <button onClick={() => setProjectPage(p => Math.min(Math.ceil(projects.length / PAGE_SIZE) - 1, p + 1))} disabled={(projectPage + 1) * PAGE_SIZE >= projects.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                  </div>
                </>
              )}
            </div>

          <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">📋 의뢰인 프로젝트 문의</h2>
                <div className="flex gap-2 text-xs">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">검토중 {clientRequests.filter(r => r.status === 'PENDING').length}</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">확인됨 {clientRequests.filter(r => r.status === 'CONFIRMED').length}</span>
                </div>
              </div>
              {clientRequests.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">문의 내역이 없습니다.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {clientRequests.slice(requestPage * PAGE_SIZE, (requestPage + 1) * PAGE_SIZE).map((req) => (
                      <div key={req.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{req.title}</p>
                            <p className="text-xs text-gray-500">{req.client_name} · {req.client_mobile} · 게시물 {req.requested_posts ?? 1}개 · {new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                            <p className="text-xs text-gray-600 mt-1">{req.content}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0 ml-2">
                            <span className={`text-xs px-2 py-1 rounded-full text-center ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {req.status === 'PENDING' ? '검토중' : req.status === 'CONFIRMED' ? '확인됨' : req.status === 'APPROVED' ? '승인' : '거절'}
                            </span>
                            {req.status === 'PENDING' && (
                              <>
                                <button onClick={async () => { 
                                  await fetch(`/api/client_requests?id=${req.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'CONFIRMED' })
                                  })
                                  fetchClientRequests()
                                }} className="text-xs bg-blue-500 text-white rounded px-2 py-1">확인</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setRequestPage(p => Math.max(0, p - 1))} disabled={requestPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                    <span className="text-xs text-gray-500">{requestPage + 1} / {Math.ceil(clientRequests.length / PAGE_SIZE)}</span>
                    <button onClick={() => setRequestPage(p => Math.min(Math.ceil(clientRequests.length / PAGE_SIZE) - 1, p + 1))} disabled={(requestPage + 1) * PAGE_SIZE >= clientRequests.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                  </div>
                </>
              )}
            </div>

            {/* 커버영상 승인 목록 */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">🎵 커버영상 승인 목록</h2>
              <div className="mb-3">
                <label className="text-sm font-medium">지급 금액</label>
                <input type="number" value={coverRewardAmount} onChange={(e) => setCoverRewardAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="커버영상 지급 금액 입력" />
              </div>
              {coverPosts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">커버영상 신청이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {coverPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{post.participants?.name}</p>
                          <p className="text-xs text-gray-500">{post.project_code} · {post.platform}</p>
                          <a href={post.post_url} target="_blank" className="text-xs text-blue-500">링크 보기 →</a>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 ml-2">
                          <span className={`text-xs px-2 py-1 rounded-full text-center ${post.cover_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : post.cover_status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {post.cover_status === 'PENDING' ? '검토중' : post.cover_status === 'APPROVED' ? '승인' : '거절'}
                          </span>
                          {post.cover_status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApproveCover(post)} className="text-xs bg-green-600 text-white rounded px-2 py-1">승인</button>
                              <button onClick={() => handleRejectCover(post.id)} className="text-xs bg-red-500 text-white rounded px-2 py-1">거절</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">🔓 락 해제 영상 관리</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input value={newUnlockUrl} onChange={(e) => setNewUnlockUrl(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="유튜브 URL 입력" />
                  <button onClick={handleAddUnlockVideo} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                </div>
                {unlockVideos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">등록된 영상이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {unlockVideos.map((v) => (
                      <div key={v.id} className="flex justify-between items-center border rounded-lg p-2">
                        <a href={v.video_url} target="_blank" className="text-xs text-blue-500 truncate flex-1 flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> {v.video_url}</a>
                        <button onClick={async () => { await fetch(`/api/unlock_videos?id=${v.id}`, { method: 'DELETE' }); fetchUnlockVideos() }} className="text-xs text-red-500 ml-2">삭제</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">🔔 푸시 알림 발송</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">발송 대상</label>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setPushTarget('all')} className={`flex-1 text-xs py-2 rounded-lg border ${pushTarget === 'all' ? 'bg-purple-600 text-white border-purple-600' : ''}`}>전체</button>
                    <button onClick={() => setPushTarget('participant')} className={`flex-1 text-xs py-2 rounded-lg border ${pushTarget === 'participant' ? 'bg-blue-600 text-white border-blue-600' : ''}`}>체험단</button>
                    <button onClick={() => setPushTarget('client')} className={`flex-1 text-xs py-2 rounded-lg border ${pushTarget === 'client' ? 'bg-green-600 text-white border-green-600' : ''}`}>의뢰인</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">제목</label>
                  <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="알림 제목" />
                </div>
                <div>
                  <label className="text-sm font-medium">내용</label>
                  <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="알림 내용" />
                </div>
                <button onClick={handleSendPush} disabled={isSendingPush} className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
                  {isSendingPush ? '발송 중...' : `${pushTarget === 'all' ? '전체' : pushTarget === 'participant' ? '체험단' : '의뢰인'} 발송`}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">📣 활동 요청 푸시</h2>
              <div className="space-y-3">
                <button onClick={async () => {
                  setIsSendingPush(true)
                  const allRes = await fetch('/api/participants')
                  const allParticipants = await allRes.json()
                  const joinedRes = await fetch('/api/project_participants')
                  const joinedIds = await joinedRes.json()
                  const joinedSet = new Set(joinedIds?.map((j: any) => j.member_id))
                  const notJoined = allParticipants?.filter((p: any) => !joinedSet.has(p.id)) ?? []
                  if (notJoined.length === 0) { alert('미참여자가 없어요.'); setIsSendingPush(false); return }
                  const tokensRes = await fetch(`/api/push_tokens?user_ids=${notJoined.map((p: any) => String(p.id)).join(',')}`)
                  const tokens = await tokensRes.json()
                  if (!tokens || tokens.length === 0) { alert('발송할 토큰이 없어요.'); setIsSendingPush(false); return }
                  await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '🎵 새 프로젝트가 기다리고 있어요!', body: '아직 참여한 프로젝트가 없어요. 지금 참여해보세요!', tokens: tokens.map((t: any) => t.token) }) })
                  alert(`✅ 미참여자 ${notJoined.length}명에게 발송됐어요!`)
                  setIsSendingPush(false)
                }} disabled={isSendingPush} className="w-full bg-orange-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
                  {isSendingPush ? '발송 중...' : '미참여자에게 발송'}
                </button>
                <button onClick={async () => {
                  setIsSendingPush(true)
                  const oneMonthAgo = new Date()
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                  const allRes = await fetch('/api/participants')
                  const allParticipants = await allRes.json()
                  const inactive: number[] = []
                  for (const p of allParticipants ?? []) {
                    const postsRes = await fetch(`/api/posts?member_id=${p.id}`)
                    const posts = await postsRes.json()
                    const recentPost = posts?.find((post: any) => new Date(post.created_at) >= oneMonthAgo)
                    const joinRes = await fetch(`/api/project_participants?member_id=${p.id}&status=ACTIVE`)
                    const joins = await joinRes.json()
                    if (!recentPost && joins.length === 0) inactive.push(p.id)
                  }
                  if (inactive.length === 0) { alert('미활동자가 없어요.'); setIsSendingPush(false); return }
                  const tokensRes = await fetch(`/api/push_tokens?user_ids=${inactive.map(id => String(id)).join(',')}`)
                  const tokens = await tokensRes.json()
                  if (!tokens || tokens.length === 0) { alert('발송할 토큰이 없어요.'); setIsSendingPush(false); return }
                  await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '💪 오랫동안 활동이 없었어요!', body: '새로운 프로젝트가 기다리고 있어요. 지금 참여해보세요!', tokens: tokens.map((t: any) => t.token) }) })
                  alert(`✅ 미활동자 ${inactive.length}명에게 발송됐어요!`)
                  setIsSendingPush(false)
                }} disabled={isSendingPush} className="w-full bg-red-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
                  {isSendingPush ? '발송 중...' : '미활동자에게 발송'}
                </button>
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className={`${activeTab === 'right' ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">{selectedProject ? '프로젝트 수정' : '프로젝트 등록'}</h2>
                <div className="flex gap-2">
                  {selectedProject && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
                  <button onClick={() => setShowProjectForm(!showProjectForm)} className="text-xs text-gray-500 border rounded px-2 py-1">
                    {showProjectForm ? '접기 ▲' : '펼치기 ▼'}
                  </button>
                </div>
              </div>
              {showProjectForm && (
                <>
                  {(productContent && productContent !== '__direct__') && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500">💰 프로젝트 총비용</p>
                      <p className="text-xl font-bold text-blue-600">{getTotalCost().toLocaleString()}원</p>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>상품: {getSelectedProductPrice().toLocaleString()}원</p>
                        {optionPrice && <p>추가 옵션: +{Number(optionPrice).toLocaleString()}원</p>}
                        {Number(requiredPosts) === 2 && <p>게시물 2개 (+50%): +{Math.floor(getSelectedProductPrice() * 0.5).toLocaleString()}원</p>}
                        {monitoringExtension > 0 && <p>모니터링 연장 ({monitoringExtension}일): +{(monitoringExtension === 15 ? 200000 : monitoringExtension === 30 ? 400000 : 600000).toLocaleString()}원</p>}
                        {refreshInterval && <p>트래픽 부스터: +{(refreshInterval === '6' ? 150000 : refreshInterval === '3' ? 300000 : 800000).toLocaleString()}원</p>}
                        {coverVideoCount > 0 && <p>커버영상 ({coverVideoCount}개): +{(coverVideoCount === 10 ? 1500000 : coverVideoCount === 20 ? 3000000 : 4500000).toLocaleString()}원</p>}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {!selectedProject ? (
                      <div>
                        <label className="text-sm font-medium">프로젝트 코드 자동생성</label>
                        <div className="flex gap-2 mt-1">
                          <input value={projectPrefix} onChange={(e) => handlePrefixChange(e.target.value)} className="w-20 border rounded-lg px-3 py-2 text-base" placeholder="A" maxLength={3} />
                          <div className="flex-1 border rounded-lg px-3 py-2 text-base bg-gray-50 text-gray-600">{projectCode || '코드 자동생성'}</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">알파벳 입력 시 자동으로 코드가 생성돼요</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium">프로젝트 코드</label>
                        <input value={projectCode} className={`${inputClass} bg-gray-100`} disabled />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">의뢰인 선택</label>
                      <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className={inputClass} placeholder="이름/소속사/아티스트 검색" />
                      {clientSearch && filteredClients.length > 0 && (
                        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {filteredClients.map((c) => (
                            <div key={c.id} onClick={() => { setSelectedClientId(c.client_id); setClientName(c.name); setClientSearch(`${c.name} - ${c.company ?? ''} ${c.artist ? `(${c.artist})` : ''} [${c.client_id}]`) }} className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${selectedClientId === c.client_id ? 'bg-blue-50' : ''}`}>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.company} {c.artist ? `· ${c.artist}` : ''} [{c.client_id}]</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedClientId && <p className="text-xs text-green-600 mt-1">✅ 선택된 의뢰인 코드: {selectedClientId}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">노래제목</label>
                      <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className={inputClass} placeholder="노래제목 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">인스타그램 음원 URL</label>
                      <input value={instagramAudioId} onChange={(e) => {
                        const match = e.target.value.match(/reels\/audio\/(\d+)/)
                        setInstagramAudioId(match ? match[1] : e.target.value)
                      }} className={inputClass} placeholder="https://www.instagram.com/reels/audio/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">틱톡 음원 URL</label>
                      <input value={tiktokAudioId} onChange={(e) => {
                        const match = e.target.value.match(/(\d{10,})/)
                        setTiktokAudioId(match ? match[1] : e.target.value)
                      }} className={inputClass} placeholder="https://www.tiktok.com/music/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">상품내용</label>
                      {products.length > 0 ? (
                        <select value={productContent} onChange={(e) => {
                          setProductContent(e.target.value)
                          if (e.target.value.includes('스탠다드') || e.target.value.includes('디럭스')) {
                            setRefreshInterval('12')
                          } else if (e.target.value.includes('프리미엄') || e.target.value.includes('메가')) {
                            setRefreshInterval('6')
                          }
                        }} className={inputClass}>
                          <option value="">상품 선택</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>{p.name} ({p.price?.toLocaleString()}P)</option>
                          ))}
                          <option value="__direct__">직접 입력</option>
                        </select>
                      ) : (
                        <input value={productContent} onChange={(e) => setProductContent(e.target.value)} className={inputClass} placeholder="상품내용 입력" />
                      )}
                      {productContent === '__direct__' && (
                        <input value="" onChange={(e) => setProductContent(e.target.value)} className={`${inputClass} mt-2`} placeholder="직접 입력" autoFocus />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">추가 옵션명 (선택)</label>
                      <input value={optionName} onChange={(e) => setOptionName(e.target.value)} className={inputClass} placeholder="예: 숏츠 3개 추가" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">추가 옵션 가격 (선택)</label>
                      <input type="number" value={optionPrice} onChange={(e) => setOptionPrice(e.target.value)} className={inputClass} placeholder="옵션 가격 입력" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">프로젝트 링크</label>
                        <button onClick={() => setProjectLinks([...projectLinks, { platform: 'youtube_shorts', url: '', isNew: true }])} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">+ 링크 추가</button>
                      </div>
                      {projectLinks.map((link, i) => (
                        <div key={i} className="flex gap-2 mt-2 items-center">
                          <select value={link.platform} onChange={(e) => {
                            const newLinks = [...projectLinks]
                            newLinks[i].platform = e.target.value
                            setProjectLinks(newLinks)
                          }} className="border rounded-lg px-2 py-2 text-base box-border">
                            <option value="">- 선택하세요 -</option>
                            <option value="youtube_shorts">유튜브 숏츠</option>
                            <option value="youtube_long">유튜브 롱폼</option>
                            <option value="playlist">플레이리스트</option>
                          </select>
                          <input value={link.url} onChange={(e) => {
                            const newLinks = [...projectLinks]
                            newLinks[i].url = e.target.value
                            setProjectLinks(newLinks)
                          }} className={`flex-1 border rounded-lg px-3 py-2 text-base box-border`} placeholder="URL 입력" />
                          <button onClick={async () => {
                            if (!link.isNew && link.id) {
                              await fetch(`/api/project_links?id=${link.id}`, { method: 'DELETE' })
                            }
                            setProjectLinks(projectLinks.filter((_, idx) => idx !== i))
                          }} className="text-red-400 text-xs px-2 py-1 border border-red-300 rounded">삭제</button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-sm font-medium">새로고침 주기 (추가 옵션)</label>
                      <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className={inputClass}>
                        <option value="">기본 (하루 1회)</option>
                        <option value="12">기본 트래픽 - 일 2회 / 12시간 주기</option>
                        <option value="6">실버 트래픽 - 일 4회 / 6시간 주기 (150,000원)</option>
                        <option value="3">골드 트래픽 - 일 8회 / 3시간 주기 (300,000원)</option>
                        <option value="1">다이아 VIP - 일 24회 / 1시간 주기 (800,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">모니터링 기간 연장 (추가 옵션)</label>
                      <select value={monitoringExtension} onChange={(e) => setMonitoringExtension(Number(e.target.value))} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="15">15일 연장 (200,000원)</option>
                        <option value="30">30일 연장 (400,000원)</option>
                        <option value="45">45일 연장 (600,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">커버영상 옵션 (추가 옵션)</label>
                      <select value={coverVideoCount} onChange={(e) => setCoverVideoCount(Number(e.target.value))} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="10">10개 (1,500,000원)</option>
                        <option value="20">20개 (3,000,000원)</option>
                        <option value="30">30개 (4,500,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">요청 게시물 수 (추가 옵션)</label>
                      <select value={requiredPosts} onChange={(e) => setRequiredPosts(e.target.value)} className={inputClass}>
                        <option value="1">1개</option>
                        <option value="2">2개 (+상품금액의 50%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">모집인원</label>
                      <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className={inputClass} placeholder="모집 인원 수 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">모집일</label>
                      <input type="date" value={missionDate} onChange={(e) => setMissionDate(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">모집 시간</label>
                      <input type="time" value={missionTime} onChange={(e) => setMissionTime(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">요청사항</label>
                      <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} className={inputClass} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">프로젝트 상태</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                        <option value="ONGOING">진행중</option>
                        <option value="PAUSED">대기중</option>
                        <option value="COMPLETED">완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">시작일</label>
                      <div className="flex gap-2">
                        <input type="date" value={startDate} onChange={(e) => {
                          setStartDate(e.target.value)
                          if (e.target.value) {
                            const end = new Date(e.target.value)
                            end.setDate(end.getDate() + 15)
                            setEndDate(end.toISOString().split('T')[0])
                          }
                        }} className={inputClass} style={dateInputStyle} />
                        <select value={startTime} onChange={(e) => {
                          setStartTime(e.target.value)
                          setEndTime(e.target.value)
                        }} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">종료일</label>
                      <div className="flex gap-2">
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} style={dateInputStyle} />
                        <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">게시물당 금액 (체험단 지급)</label>
                      <input type="number" value={rewardPerPost} onChange={(e) => setRewardPerPost(e.target.value)} className={inputClass} placeholder="기본값: 2,500원" />
                      <p className="text-xs text-gray-400 mt-1">※ 미입력 시 기본값 2,500원으로 등록됩니다</p>
                    </div>
                    <div>
                      {selectedProject ? (
                        <button onClick={handleUpdate} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">정보 수정하기</button>
                      ) : (
                        <button onClick={handleInsert} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">의뢰인 등록</button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedProject && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">👥 참여자 목록 ({participants.length}명)</h2>
                  {selectedParticipantId && (
                    <button onClick={() => setSelectedParticipantId(null)} className="text-xs text-gray-500 border rounded px-2 py-1">전체보기</button>
                  )}
                </div>
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">참여자가 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {participants.slice(participantPage * PAGE_SIZE, (participantPage + 1) * PAGE_SIZE).map((p) => (
                        <div key={p.id} onClick={() => setSelectedParticipantId(selectedParticipantId === p.member_id ? null : p.member_id)} className={`border rounded-lg p-3 cursor-pointer ${selectedParticipantId === p.member_id ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <p className="text-sm font-medium">{p.participants?.name}</p>
                          <p className="text-xs text-gray-500">📱 {p.participants?.mobile}</p>
                          {p.participants?.instagram_id && <p className="text-xs text-gray-500"><svg viewBox="0 0 24 24" className="w-3 h-3 inline mr-1" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> <a href={`https://www.instagram.com/${p.participants.instagram_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.instagram_id}</a>{p.participants?.instagram_followers > 0 && ` (${p.participants.instagram_followers.toLocaleString()}명)`}</p>}
                          {p.participants?.youtube_id && <p className="text-xs text-gray-500"><svg viewBox="0 0 24 24" className="w-3 h-3 inline mr-1" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> <a href={`https://www.youtube.com/@${p.participants.youtube_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.youtube_id}</a>{p.participants?.youtube_subscribers > 0 && ` (${p.participants.youtube_subscribers.toLocaleString()}명)`}</p>}
                          {p.participants?.tiktok_id && <p className="text-xs text-gray-500"><svg viewBox="0 0 24 24" className="w-3 h-3 inline mr-1" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> <a href={`https://www.tiktok.com/@${p.participants.tiktok_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.tiktok_id}</a>{p.participants?.tiktok_followers > 0 && ` (${p.participants.tiktok_followers.toLocaleString()}명)`}</p>}
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-400">참여일: {new Date(p.joined_at).toLocaleDateString('ko-KR')}</p>
                            <button onClick={(e) => { e.stopPropagation(); handleCancelParticipation(p.id, p.participants?.name, p.member_id) }} className="text-xs text-red-500 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50">참여취소</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {participants.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setParticipantPage(p => Math.max(0, p - 1))} disabled={participantPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <span className="text-xs text-gray-500">{participantPage + 1} / {Math.ceil(participants.length / PAGE_SIZE)}</span>
                        <button onClick={() => setParticipantPage(p => Math.min(Math.ceil(participants.length / PAGE_SIZE) - 1, p + 1))} disabled={(participantPage + 1) * PAGE_SIZE >= participants.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {selectedProject && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">📋 게시물 목록 ({selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId).length : posts.length}개)</h2>
                  {posts.length > 0 && (
                    <button onClick={handleUpdateProjectLikes} disabled={isUpdatingLikes} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg disabled:bg-gray-400">
                      {isUpdatingLikes ? '갱신 중...' : '🔄 좋아요 갱신'}
                    </button>
                  )}
                </div>
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                    {(selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts)
                      .sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0))
                      .slice(adminPostPage * PAGE_SIZE, (adminPostPage + 1) * PAGE_SIZE)
                      .map((post, index) => {
                        const rank = adminPostPage * PAGE_SIZE + index + 1
                        const isEligible = (post.likes_count ?? 0) >= 1000
                        return (
                          <div key={post.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {isEligible ? (
                                    <span className={`text-xs font-bold ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-300">-</span>
                                  )}
                                  <p className="text-sm font-medium">{post.influencer_name}{post.is_cover && <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded ml-1">COVER</span>}</p>
                                </div>
                                <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                                <a href={post.post_url} target="_blank" className="text-xs text-blue-500 block overflow-hidden text-ellipsis whitespace-nowrap">링크 보기 →</a>
                                <button onClick={() => {
                                  const newUrl = prompt('새 URL을 입력해주세요:', post.post_url)
                                  if (newUrl) { fetch(`/api/posts?id=${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_url: newUrl }) }).then(() => { alert('수정 완료!'); fetchPosts(selectedProject.project_code) }) }
                                }} className="text-xs text-orange-500 mt-1 block">URL 수정</button>
                                <p className="text-xs mt-1">❤️ {post.likes_count?.toLocaleString()} · 💬 {post.comments_count?.toLocaleString()}</p>
                                {!isEligible && <p className="text-xs text-red-400">⚠️ 좋아요 1,000건 미만 시상 제외</p>}
                              </div>
                              <button onClick={() => handleUpdateSingleLike(post)} disabled={updatingPostId === post.id} className="text-xs bg-orange-500 text-white rounded px-2 py-1 disabled:bg-gray-400 shrink-0">
                                {updatingPostId === post.id ? '...' : '갱신'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {(selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts).length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setAdminPostPage(p => Math.max(0, p - 1))} disabled={adminPostPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <span className="text-xs text-gray-500">{adminPostPage + 1} / {Math.ceil((selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts).length / PAGE_SIZE)}</span>
                        <button onClick={() => setAdminPostPage(p => Math.min(Math.ceil((selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts).length / PAGE_SIZE) - 1, p + 1))} disabled={(adminPostPage + 1) * PAGE_SIZE >= (selectedParticipantId ? posts.filter(p => p.member_id === selectedParticipantId) : posts).length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
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