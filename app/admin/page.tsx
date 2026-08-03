'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { Heart, ThumbsUp, MessageCircle, PlayCircle } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useToast } from '../../components/ToastContext'
import AdminBottomNav from '../../components/AdminBottomNav'
import AdminParticipantList from '../../components/AdminParticipantList'
import AdminPostList from '../../components/AdminPostList'
import AdminProjectApplications from '../../components/AdminProjectApplications'
import AdminClientRequests from '../../components/AdminClientRequests'
import AdminPushSection from '../../components/AdminPushSection'
import AdminUnlockVideos from '../../components/AdminUnlockVideos'
import AdminProductManager from '../../components/AdminProductManager'
import AdminProjectList from '../../components/AdminProjectList'
import PlatformIcon from '../../components/PlatformIcon'

export default function Page1() {
  const [projects, setProjects] = useState<any[]>([])
  const [formData, setFormData] = useState({
    artistName: '', songTitle: '', clientName: '', projectCode: '', projectPrefix: '',
    productContent: '', requirements: '', status: 'PENDING',
    startDate: '', endDate: '', startTime: '', endTime: '',
    missionDate: '', missionTime: '', maxParticipants: '', rewardPerPost: '2500',
    requiredPosts: '1', refreshInterval: '' as string, monitoringExtension: 0, coverVideoCount: 0,
    coverRewardAmount: '', shortsUrl1: '', shortsUrl2: '', playlistUrl: '',
    instagramAudioId: '', tiktokAudioId: '', youtubeAudioId: '',
    secondPostDate: '', secondPostTime: '', coverImageUrl: '', selectedClientId: '',
    projectLinks: [{ platform: 'youtube_shorts', url: '', isNew: true }] as any[],
    optionName: '', optionPrice: '',
  })
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingLikes, setIsUpdatingLikes] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [updatingPostId, setUpdatingPostId] = useState<number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [showProductManager, setShowProductManager] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [isSendingPush, setIsSendingPush] = useState(false)
  const [clientRequests, setClientRequests] = useState<any[]>([])
  const [projectApplications, setProjectApplications] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [unlockVideos, setUnlockVideos] = useState<any[]>([])
  const [newUnlockUrl, setNewUnlockUrl] = useState('')
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [coverPosts, setCoverPosts] = useState<any[]>([])
  const [topRanker, setTopRanker] = useState<any>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [projectPage, setProjectPage] = useState(0)
  const [requestPage, setRequestPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left')
  const [adminPostPage, setAdminPostPage] = useState(0)
  const [participantPage, setParticipantPage] = useState(0)
  const [pushTarget, setPushTarget] = useState<'all' | 'participant' | 'client'>('all')
  const [artistList, setArtistList] = useState<any[]>([])
  const [replyText, setReplyText] = useState<{[key: number]: string}>({})
  const [expandedReply, setExpandedReply] = useState<{[key: number]: boolean}>({})
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [requestFilter, setRequestFilter] = useState<'all' | 'client' | 'participant'>('all')
  const [showSidebar, setShowSidebar] = useState(false)
  const PAGE_SIZE = 5
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    if ((window as any).Capacitor) {
      import('@capawesome/capacitor-badge').then(({ Badge }) => Badge.clear()).catch(() => {})
    }
    const userInfo = localStorage.getItem('userInfo')
    const loadData = async () => {
      await Promise.all([
        fetchProjects(),
        fetchProducts(),
        fetchClients(),
        fetchClientRequests(),
        fetchProjectApplications(),
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

  const fetchProjectApplications = async () => {
    const res = await fetch('/api/project_applications')
    const data = await res.json()
    setProjectApplications(data ?? [])
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

  const handleApproveCover = async (post: any, type: string = 'long') => {
    if (!formData.coverRewardAmount) { showToast('지급할 금액을 입력해주세요.'); return }
    const reward = Number(formData.coverRewardAmount)
    
    // 커버영상 승인 처리
    await fetch(`/api/posts?id=${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_status: 'APPROVED', cover_type: type })
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
          title: '🎵 커버영상 승인됐어요!', data: { url: '/participant' },
          body: `커버영상(${type === 'long' ? '롱폼' : '숏츠'})이 승인됐어요. 미션 시작일로부터 7일 이내에 업로드해주세요. ${reward.toLocaleString()}P이 추가 지급됐어요.`,
          tokens: tokens.map((t: any) => t.token),
          userIds: [String(post.member_id)]
        })
      })
    }
    
    showToast('승인 완료!')
    setFormData(prev => ({...prev, coverRewardAmount: ''}))
    fetchCoverPosts()
  }

  const handleRejectCover = async (postId: number) => {
    await fetch(`/api/posts?id=${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_status: 'REJECTED' })
    })
    showToast('거절 완료!')
    fetchCoverPosts()
  }

  const handleAddUnlockVideo = async () => {
    if (!newUnlockUrl) { showToast('URL을 입력해주세요.'); return }
    const match = newUnlockUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)
    const videoId = match?.[1] ?? ''
    if (!videoId) { showToast('유효한 유튜브 URL을 입력해주세요.'); return }
    const res = await fetch('/api/unlock_videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: newUnlockUrl, video_id: extractVideoId(newUnlockUrl), title: '락 해제용 영상' })
    })
    if (!res.ok) { showToast('등록 실패!'); return }
    setNewUnlockUrl('')
    fetchUnlockVideos()
    showToast('등록 완료!')
  }

  const handleAddProduct = async () => {
    if (!newProduct) { showToast('상품명을 입력해주세요.'); return }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProduct, price: Number(newProductPrice) || 0 })
    })
    if (!res.ok) { showToast('등록 실패!'); return }
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
      const projectCodes = [...new Set(data.map((p: any) => p.project_code))].join(',')
      const [participantRes, projectsRes] = await Promise.all([
        fetch(`/api/participants?ids=${memberIds}`),
        fetch(`/api/projects?codes=${projectCodes}`)
      ])
      const participantData = await participantRes.json()
      const projectsData = await projectsRes.json()
      const merged = data.map((p: any) => ({
        ...p,
        participants: participantData?.find((pd: any) => pd.id === p.member_id),
        projects: projectsData?.find((proj: any) => proj.project_code.toLowerCase() === p.project_code.toLowerCase())
      }))
      setCoverPosts(merged)
    } else {
      setCoverPosts([])
    }
  }

  const fetchPosts = async (code: string) => {
    const res = await fetch(`/api/posts?project_code=${code}`)
    const data = await res.json()
    
    if (data && data.length > 0) {
      const memberIds = [...new Set(data.map((p: any) => p.member_id))].join(',')
      const participantsRes = await fetch(`/api/participants?ids=${memberIds}`)
      const participantsData = await participantsRes.json()
      
      const merged = data.map((post: any) => ({
        ...post,
        participant: participantsData?.find((p: any) => p.id === post.member_id)
      }))
      setPosts(merged)
    } else {
      setPosts(data ?? [])
    }
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
    if (!reason.trim()) { showToast('취소 사유를 입력해주세요.'); return }

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
            body: `[${selectedProject?.artist_name || selectedProject?.client_name} - ${selectedProject?.song_title}] 참여취소 사유: ${reason}`,
            tokens: tokens.map((t: any) => t.token),
            userIds: [String(memberId)]
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
              body: `${selectedProject.artist_name || selectedProject.client_name} - ${selectedProject.song_title} 프로젝트에 참여 공석이 생겼습니다. 지금 참여해보세요!`,
              tokens: nonParticipantTokens.map((t: any) => t.token),
              userIds: nonParticipantTokens.map((t: any) => t.user_id)
            })
          })
        }
      }

      showToast(`${name}님 참여취소 완료\n- 삭제된 게시물: ${result.postsDeleted}건\n- 회수 포인트: ${result.deducted?.toLocaleString() ?? 0}P\n- 푸시 알림 발송됨`)
      if (selectedProject) {
        fetchParticipants(selectedProject.project_code)
        fetchPosts(selectedProject.project_code)
      }
    } else {
      showToast('참여취소 실패')
    }
  }

  // 알파벳 입력 시 자동으로 프로젝트 코드 생성
  const handlePrefixChange = async (prefix: string) => {
    const upper = prefix.toUpperCase().replace(/[^A-Z]/g, '')
    setFormData(prev => ({...prev, projectPrefix: upper}))
    if (!upper) { setFormData(prev => ({...prev, projectCode: ''})); return }

    const res = await fetch(`/api/projects?prefix=${upper}`)
    const data = await res.json()
    const nextNum = (data?.length ?? 0) + 1
    setFormData(prev => ({...prev, projectCode: `${upper}_${nextNum}`}))
  }

  const handleSelectProject = (project: any) => {
    if (selectedProject?.id === project.id) {
      clearForm()
      return
    }
    setSelectedProject(project)
    setActiveTab('right')
    setCoverImageFile(null)
    setFormData(prev => ({ ...prev,
      clientName: project.client_name ?? '',
      artistName: project.artist_name ?? '',
      projectCode: project.project_code ?? '',
      projectPrefix: project.project_code?.split('_')[0] ?? '',
      productContent: project.product_content ?? '',
      songTitle: project.song_title ?? '',
      coverImageUrl: project.cover_image_url ?? '',
      instagramAudioId: project.instagram_audio_id ?? '',
      tiktokAudioId: project.tiktok_audio_id ?? '',
      requirements: project.requirements ?? '',
      status: project.status ?? 'PENDING',
      startDate: project.start_date ? project.start_date.substring(0, 10) : '',
      endDate: project.end_date ? project.end_date.substring(0, 10) : '',
      rewardPerPost: String(project.reward_per_post ?? ''),
      optionName: project.option_name ?? '',
      optionPrice: project.option_price ?? '',
      monitoringExtension: project.monitoring_extension ?? 0,
      coverVideoCount: project.cover_video_count ?? 0,
      selectedClientId: project.client_id ?? '',
      youtubeAudioId: project.youtube_audio_id ?? '',
      shortsUrl1: '', shortsUrl2: '', playlistUrl: '',
      startTime: project.start_time ?? '',
      endTime: project.end_time ?? '',
      maxParticipants: String(project.max_participants ?? ''),
      missionDate: project.mission_date ?? '',
      missionTime: project.mission_time ?? '',
      requiredPosts: String(project.required_posts ?? 1),
      refreshInterval: String(project.refresh_interval ?? ''),
      secondPostDate: project.second_post_date ?? '',
      secondPostTime: project.second_post_time ?? '',
    }))
    fetchPosts(project.project_code)
    fetch(`/api/project_videos?project_code=${project.project_code}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setFormData(prev => ({ ...prev,
            shortsUrl1: data.shorts_url_1 ?? '',
            shortsUrl2: data.shorts_url_2 ?? '',
            playlistUrl: data.playlist_url ?? '',
          }))
        }
      })
    fetchParticipants(project.project_code)
    fetchTopRanker(project.project_code)
    fetch(`/api/project_links?project_code=${project.project_code}`)
      .then(res => res.json())
      .then(data => {
        const existing = Array.isArray(data) ? data.map((link: any) => ({ ...link, isNew: false })) : []
        setFormData(prev => ({...prev, projectLinks: [...existing, { platform: 'youtube_shorts', url: '', isNew: true }]}))
      })
  }

  const getSelectedProductPrice = () => {
    const product = products.find(p => p.name === formData.productContent)
    return product?.price ?? 0
  }

  const getTotalCost = () => {
    const productPrice = getSelectedProductPrice()
    const option = Number(formData.optionPrice) || 0
    const monitoring = formData.monitoringExtension === 15 ? 200000 : formData.monitoringExtension === 30 ? 400000 : formData.monitoringExtension === 45 ? 600000 : 0
    const traffic = formData.refreshInterval === '6' ? 150000 : formData.refreshInterval === '3' ? 300000 : formData.refreshInterval === '1' ? 800000 : 0
    const cover = formData.coverVideoCount === 10 ? 1500000 : formData.coverVideoCount === 20 ? 3000000 : formData.coverVideoCount === 30 ? 4500000 : 0
    const extraPosts = Number(formData.requiredPosts) === 2 ? Math.floor(productPrice * 0.5) : 0
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
      shorts_url_1: formData.shortsUrl1 || null,
      shorts_video_id_1: formData.shortsUrl1 ? extractVideoId(formData.shortsUrl1) : null,
      shorts_url_2: formData.shortsUrl2 || null,
      shorts_video_id_2: formData.shortsUrl2 ? extractVideoId(formData.shortsUrl2) : null,
      playlist_url: formData.playlistUrl || null,
      playlist_video_id: formData.playlistUrl ? extractVideoId(formData.playlistUrl) : null,
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
    for (const link of formData.projectLinks) {
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
        // 참여중인 체험단 푸시
        const participantsRes = await fetch(`/api/project_participants?project_code=${projectCode}`)
        const participants = await participantsRes.json()
        if (participants && participants.length > 0) {
          const memberIds = participants.map((p: any) => String(p.member_id))
          const tokenRes = await fetch(`/api/push_tokens?user_ids=${memberIds.join(',')}`)
          const tokens = await tokenRes.json()
          if (tokens && tokens.length > 0) {
            await fetch('/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '💬 댓글 미션이 추가됐어요!', data: { url: '/participant' },
                body: `댓글을 달고 300P를 받으세요!`,
                tokens: tokens.map((t: any) => t.token),
                userIds: memberIds
              })
            })
          }
        }
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
    setFormData(prev => ({...prev, projectLinks: data ?? []}))
  }

  const handleInsert = async () => {
    if (!formData.projectCode) { showToast('프로젝트 코드를 입력해주세요.'); return }
    
    // 이미지 업로드
    let uploadedImageUrl = ''
    if (coverImageFile) {
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(`${formData.projectCode.toUpperCase()}_${Date.now()}`, coverImageFile, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path)
        uploadedImageUrl = urlData.publicUrl
      }
    }
    
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_code: formData.projectCode.toUpperCase(),
        client_name: formData.clientName,
        product_content: formData.productContent,
        song_title: formData.songTitle,
        artist_name: formData.artistName || null,
        cover_image_url: uploadedImageUrl || null,
        instagram_audio_id: formData.instagramAudioId || null,
        tiktok_audio_id: formData.tiktokAudioId || null,
        youtube_audio_id: formData.youtubeAudioId || null,
        requirements: formData.requirements,
        status: formData.status,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        reward_per_post: Number(formData.rewardPerPost) || 2500,
        max_participants: Number(formData.maxParticipants) || 0,
        mission_date: formData.missionDate || null,
        mission_time: formData.missionTime || null,
        option_name: formData.optionName || null,
        option_price: Number(formData.optionPrice) || null,
        client_id: formData.selectedClientId || null,
        required_posts: Number(formData.requiredPosts) || 1,
        refresh_interval: formData.refreshInterval ? Number(formData.refreshInterval) : null,
        base_refresh_interval: formData.productContent.includes('프리미엄') || formData.productContent.includes('메가') ? 6 : 12,
        monitoring_extension: Number(formData.monitoringExtension) || 0,
        cover_video_count: Number(formData.coverVideoCount) || 0,
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
        second_post_date: formData.secondPostDate || null,
        second_post_time: formData.secondPostTime || null,
      })
    })
    if (!res.ok) { showToast('등록 실패!'); return }
    if (formData.selectedClientId) {
      await fetch(`/api/users?client_id=${formData.selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_code: formData.projectCode.toUpperCase() })
      })
    }
    await saveProjectVideos(formData.projectCode.toUpperCase())
    await saveProjectLinks(formData.projectCode.toUpperCase())
    
    // 신청에서 불러온 경우 project_code 저장
    const approvedApp = projectApplications.find(a => a.status === 'APPROVED' && !a.project_code && a.artist_name === formData.artistName && a.song_title === formData.songTitle)
    if (approvedApp) {
      await fetch(`/api/project_applications?id=${approvedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_code: formData.projectCode.toUpperCase() })
      })
      fetchProjectApplications()
    }
    
    // 체험단 전체에게 푸시
    const participantTokensRes = await fetch('/api/push_tokens?user_role=participant')
    const participantTokens = await participantTokensRes.json()
    if (participantTokens && participantTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎵 새 프로젝트가 등록됐어요!',
          body: `${formData.artistName || formData.productContent} - ${formData.songTitle || formData.productContent} 프로젝트가 등록됐어요. 모집일: ${formData.missionDate || '미정'}. 앱에서 확인해보세요!`,
          tokens: participantTokens.map((t: any) => t.token),
          userIds: participantTokens.map((t: any) => t.user_id),
          saveToRole: 'participant'
        })
      })
    }

    // 해당 의뢰인에게만 푸시
    if (formData.selectedClientId) {
      const clientUserRes = await fetch(`/api/users?client_id=${formData.selectedClientId}`)
      const clientUserData = await clientUserRes.json()
      const clientUser = clientUserData?.[0]
      if (clientUser) {
        const clientTokensRes = await fetch(`/api/push_tokens?user_id=${String(clientUser.id)}`)
        const clientTokens = await clientTokensRes.json()
        if (clientTokens && clientTokens.length > 0) {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎵 프로젝트가 등록됐어요!',
              body: `${formData.artistName || formData.productContent} - ${formData.songTitle || formData.productContent} 프로젝트가 등록됐어요. 앱에서 확인해보세요!`,
              tokens: clientTokens.map((t: any) => t.token),
              userIds: [String(clientUser.id)]
            })
          })
        }
      }
    }
    showToast('등록 완료!')
    fetchProjects()
    fetchClients()
    clearForm()
  }

  const handleUpdate = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
    // 이미지 업로드
    let uploadedImageUrl = selectedProject?.cover_image_url || ''
    if (coverImageFile) {
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(`${selectedProject.project_code}_${Date.now()}`, coverImageFile, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path)
        uploadedImageUrl = urlData.publicUrl
      }
    }

    const res = await fetch(`/api/projects?project_code=${selectedProject.project_code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: formData.clientName,
        product_content: formData.productContent,
        song_title: formData.songTitle,
        artist_name: formData.artistName || null,
        cover_image_url: uploadedImageUrl || null,
        instagram_audio_id: formData.instagramAudioId || null,
        tiktok_audio_id: formData.tiktokAudioId || null,
        youtube_audio_id: formData.youtubeAudioId || null,
        requirements: formData.requirements,
        status: formData.status,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        reward_per_post: Number(formData.rewardPerPost) || 2500,
        max_participants: Number(formData.maxParticipants) || 0,
        mission_date: formData.missionDate || null,
        mission_time: formData.missionTime || null,
        option_name: formData.optionName || null,
        option_price: Number(formData.optionPrice) || null,
        client_id: formData.selectedClientId || null,
        required_posts: Number(formData.requiredPosts) || 1,
        refresh_interval: formData.refreshInterval ? Number(formData.refreshInterval) : null,
        base_refresh_interval: formData.productContent.includes('프리미엄') || formData.productContent.includes('메가') ? 6 : 12,
        monitoring_extension: Number(formData.monitoringExtension) || 0,
        cover_video_count: Number(formData.coverVideoCount) || 0,
        start_time: formData.startTime || null,
        end_time: formData.endTime || null,
        second_post_date: formData.secondPostDate || null,
        second_post_time: formData.secondPostTime || null,
      })
    })
    if (!res.ok) { showToast('수정 실패!'); return }
    if (formData.selectedClientId) {
      await fetch(`/api/users?client_id=${formData.selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_code: formData.projectCode.toUpperCase() })
      })
    }
    await saveProjectLinks(formData.projectCode.toUpperCase())

    // 프로젝트 상태 변경 시 푸시
    if (formData.status === 'COMPLETED') {
      const joinedRes = await fetch(`/api/project_participants?project_code=${formData.projectCode}`)
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
              body: `${formData.artistName || formData.productContent} - ${formData.songTitle || formData.productContent} 프로젝트가 종료됐어요. 환전 신청을 확인해보세요!`,
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
            body: `${formData.artistName || formData.productContent} - ${formData.songTitle || formData.productContent} 프로젝트가 종료됐어요. 결과보고서를 확인해보세요!`,
            tokens: clientTokens.map((t: any) => t.token),
            userIds: clientTokens.map((t: any) => t.user_id)
          })
        })
      }
    }

    showToast('수정 완료!')
    fetchProjects()
    fetchClients()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) { showToast('제목과 내용을 입력해주세요.'); return }
    setIsSendingPush(true)
    
    const url = pushTarget === 'all' 
      ? '/api/push_tokens' 
      : pushTarget === 'participant'
      ? '/api/push_tokens?user_role=participant'
      : '/api/push_tokens?user_role=client'
    
    const res = await fetch(url)
    const tokens = await res.json()
    if (!tokens || tokens.length === 0) { showToast('등록된 푸시 토큰이 없어요.'); setIsSendingPush(false); return }
    
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: pushTitle,
        body: pushBody,
        tokens: tokens.map((t: any) => t.token),
        userIds: tokens.map((t: any) => t.user_id),
        saveToRole: pushTarget === 'all' ? 'participant' : pushTarget === 'participant' ? 'participant' : 'client'
      })
    })
    const data = await response.json()
    if (data.success) {
      showToast(`✅ 푸시 알림 발송 완료! ${tokens.length}명에게 발송됐어요.`)
      setPushTitle('')
      setPushBody('')
    } else {
      showToast('발송 실패!')
    }
    setIsSendingPush(false)
  }

  const getInstagramStats = async (url: string) => {
    try {
      const shortcode = url.split('/p/')[1]?.split('/')[0] || url.split('/reel/')[1]?.split('/')[0]
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
    showToast('갱신 완료!')
    fetchPosts(selectedProject.project_code)
  }

  const handleUpdateSingleLike = async (post: any) => {
    if (!['instagram', 'youtube', 'tiktok'].includes(post.platform)) {
      showToast('인스타그램/유튜브/틱톡 게시물만 갱신 가능해요!')
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
        showToast('갱신 완료!')
      }
    } catch { showToast('갱신 실패!') }
    setUpdatingPostId(null)
  }

  const handleConvertCover = async (postId: number) => {
    if (!confirm('이 게시물을 커버 게시물로 전환하시겠어요?')) return
    await fetch(`/api/posts?id=${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_cover: true, cover_status: 'PENDING' })
    })
    fetchPosts(selectedProject.project_code)
    showToast('커버 게시물로 전환됐어요!')
  }

  const handleDeletePost = async (post: any) => {
    if (!confirm('게시물을 삭제하시겠어요? 해당 게시물의 적립금도 차감됩니다.')) return
    const freshRes = await fetch(`/api/participants?id=${post.member_id}`)
    const freshData = await freshRes.json()
    const currentBalance = freshData?.[0]?.balance ?? 0
    const projectRes = await fetch(`/api/projects?project_code=${post.project_code}`)
    const projectData = await projectRes.json()
    const baseAmount = projectData?.[0]?.reward_per_post ?? 0
    const level = freshData?.[0]?.level ?? 1
    const earnAmount = level === 50 ? 10000 : Math.min(2500 + (level - 1) * 150, 10000)
    const deductAmount = post.is_cover ? (freshData?.[0]?.cover_reward ?? 0) + Math.min(baseAmount, earnAmount) : Math.min(baseAmount, earnAmount)
    if (deductAmount > 0) {
      await fetch(`/api/participants?id=${post.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: Math.max(0, currentBalance - deductAmount) })
      })
      await fetch('/api/point_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: post.member_id, amount: -deductAmount, memo: post.is_cover ? `커버 게시물 삭제 (관리자) (${projectData?.[0]?.artist_name || post.project_code} / ${projectData?.[0]?.song_title ?? ''})` : `게시물 삭제 (관리자) (${projectData?.[0]?.artist_name || post.project_code} / ${projectData?.[0]?.song_title ?? ''})` })
      })
    }
    await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' })
    fetchPosts(selectedProject.project_code)
    showToast('게시물이 삭제됐어요.')
  }

  const clearForm = () => {
    setSelectedProject(null)
    setClientSearch('')
    setPosts([])
    setArtistList([])
    setFormData({
      artistName: '', songTitle: '', clientName: '', projectCode: '', projectPrefix: '',
      productContent: '', requirements: '', status: 'PENDING',
      startDate: '', endDate: '', startTime: '', endTime: '',
      missionDate: '', missionTime: '', maxParticipants: '', rewardPerPost: '',
      requiredPosts: '1', refreshInterval: '', monitoringExtension: 0, coverVideoCount: 0,
      coverRewardAmount: '', shortsUrl1: '', shortsUrl2: '', playlistUrl: '',
      instagramAudioId: '', tiktokAudioId: '', youtubeAudioId: '',
      secondPostDate: '', secondPostTime: '', coverImageUrl: '', selectedClientId: '',
      projectLinks: [{ platform: 'youtube_shorts', url: '', isNew: true }],
      optionName: '', optionPrice: '',
    })
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
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/admin'), active: true },
          { icon: '🏢', label: '의뢰인', onClick: () => router.push('/client') },
          { icon: '👤', label: '회원관리', onClick: () => router.push('/members') },
          { icon: '💰', label: '정산', onClick: () => router.push('/settlement') },
          { icon: '🎵', label: '커버', onClick: () => router.push('/cover') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/admin-mypage') },
        ]}
      />     
      <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        } else {
          setPullStartY(0)
        }
      }}
      onTouchMove={(e) => {
        if (pullStartY === 0) return
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
              {isRefreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
              ) : (
                <><ArrowDown size={14} /> 놓으면 새로고침</>
              )}
            </div>
          )}
          <div className="w-full flex justify-center mb-2 max-w-7xl mx-auto">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer" onClick={() => router.push('/admin')} />
          </div>
          <div className="flex justify-between items-center mb-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">프로젝트 관리</h1>
            </div>
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
                        {unreadCount > 0 && (
                          <button onClick={() => markAllRead(String(JSON.parse(localStorage.getItem('userInfo') || '{}').id))} className="text-xs text-blue-500 border border-blue-200 rounded px-2 py-1">모두읽음</button>
                        )}
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
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
        </div>
        <div className="max-w-7xl mx-auto">      

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
            <AdminProductManager
              products={products}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              newProductPrice={newProductPrice}
              setNewProductPrice={setNewProductPrice}
              onAdd={handleAddProduct}
              onDelete={handleDeleteProduct}
            />

            <AdminProjectList
              projects={projects}
              selectedProject={selectedProject}
              projectPage={projectPage}
              setProjectPage={setProjectPage}
              PAGE_SIZE={PAGE_SIZE}
              onSelectProject={handleSelectProject}
            />
            
          <AdminProjectApplications
            projectApplications={projectApplications}
            onApprove={(app) => {
              setFormData(prev => ({...prev, artistName: app.artist_name ?? '', songTitle: app.song_title ?? '', missionDate: app.mission_date ?? '', coverVideoCount: app.cover_count ?? 0, requirements: app.requirements ?? '', coverImageUrl: app.jacket_image ?? ''}))
              fetch(`/api/project_applications?id=${app.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'APPROVED' })
              })
              fetchProjectApplications()
              setSelectedProject(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onLoad={(app) => {
              setFormData(prev => ({...prev, artistName: app.artist_name ?? '', songTitle: app.song_title ?? '', missionDate: app.mission_date ?? '', coverVideoCount: app.cover_count ?? 0, requirements: app.requirements ?? '', coverImageUrl: app.jacket_image ?? ''}))
              setSelectedProject(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
          <AdminClientRequests
            clientRequests={clientRequests}
            PAGE_SIZE={PAGE_SIZE}
            projectCode={formData.projectCode}
            onConfirm={async (reqId) => {
              await fetch(`/api/client_requests?id=${reqId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CONFIRMED' })
              })
              fetchClientRequests()
            }}
            onCoverApprove={async (req) => {
              const participantName = prompt('커버 승인할 체험단 이름 또는 ID를 입력해주세요:')
              if (!participantName) return
              const pRes = await fetch(`/api/participants?name=${encodeURIComponent(participantName)}`)
              const pData = await pRes.json()
              const participant = pData?.[0]
              if (!participant) { showToast('체험단을 찾을 수 없어요.'); return }
              await fetch('/api/cover_requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  project_code: req.project_code ?? formData.projectCode,
                  participant_id: participant.id,
                  status: 'APPROVED',
                  approved_at: new Date().toISOString()
                })
              })
              await fetch(`/api/client_requests?id=${req.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'APPROVED' })
              })
              showToast('커버 승인 완료!')
              fetchClientRequests()
            }}
            onRefresh={fetchClientRequests}
            showToast={showToast}
          />
          <AdminUnlockVideos
            unlockVideos={unlockVideos}
            newUnlockUrl={newUnlockUrl}
            setNewUnlockUrl={setNewUnlockUrl}
            onAdd={handleAddUnlockVideo}
            onDelete={async (id) => { await fetch(`/api/unlock_videos?id=${id}`, { method: 'DELETE' }); fetchUnlockVideos() }}
          />

            <AdminPushSection
              pushTarget={pushTarget}
              setPushTarget={setPushTarget}
              pushTitle={pushTitle}
              setPushTitle={setPushTitle}
              pushBody={pushBody}
              setPushBody={setPushBody}
              isSendingPush={isSendingPush}
              setIsSendingPush={setIsSendingPush}
              onSendPush={handleSendPush}
              showToast={showToast}
            />
          </div>

          {/* 오른쪽 컬럼 */}
          <div className={`${activeTab === 'right' ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">{selectedProject ? '프로젝트 수정' : '프로젝트 등록'}</h2>
                <div className="flex gap-2">
                  {selectedProject && (
                    <button onClick={async () => {
                      const url = `https://app.doubleb.kr/report?project_code=${selectedProject.project_code}`
                      if ((window as any).Capacitor?.isNativePlatform?.()) {
                        const { Browser } = await import('@capacitor/browser')
                        await Browser.open({ url })
                      } else {
                        window.open(url, '_blank')
                      }
                    }} className="text-xs bg-green-600 text-white border rounded px-2 py-1 flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      보고서
                    </button>
                  )}
                  {selectedProject && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
                  <button onClick={() => setShowProjectForm(!showProjectForm)} className="text-xs text-gray-500 border rounded px-2 py-1">
                    {showProjectForm ? '접기 ▲' : '펼치기 ▼'}
                  </button>
                </div>
              </div>
              {showProjectForm && (
                <>
                  {(formData.productContent && formData.productContent !== '__direct__') && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500">💰 프로젝트 총비용</p>
                      <p className="text-xl font-bold text-blue-600">{getTotalCost().toLocaleString()}원</p>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>상품: {getSelectedProductPrice().toLocaleString()}원</p>
                        {formData.optionPrice && <p>추가 옵션: +{Number(formData.optionPrice).toLocaleString()}원</p>}
                        {Number(formData.requiredPosts) === 2 && <p>게시물 2개 (+50%): +{Math.floor(getSelectedProductPrice() * 0.5).toLocaleString()}원</p>}
                        {formData.monitoringExtension > 0 && <p>모니터링 연장 ({formData.monitoringExtension}일): +{(formData.monitoringExtension === 15 ? 200000 : formData.monitoringExtension === 30 ? 400000 : 600000).toLocaleString()}원</p>}
                        {formData.refreshInterval && formData.refreshInterval !== '' && formData.refreshInterval !== '0' && formData.refreshInterval !== '12' && <p>트래픽 부스터: +{(formData.refreshInterval === '6' ? 150000 : formData.refreshInterval === '3' ? 300000 : 800000).toLocaleString()}원</p>}
                        {formData.coverVideoCount > 0 && <p>커버영상 ({formData.coverVideoCount}개): +{(formData.coverVideoCount === 10 ? 1500000 : formData.coverVideoCount === 20 ? 3000000 : 4500000).toLocaleString()}원</p>}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {!selectedProject ? (
                      <div>
                        <label className="text-sm font-medium">프로젝트 코드 자동생성</label>
                        <div className="flex gap-2 mt-1">
                          <input value={formData.projectPrefix} onChange={(e) => handlePrefixChange(e.target.value)} className="w-20 border rounded-lg px-3 py-2 text-base" placeholder="A" maxLength={3} />
                          <div className="flex-1 border rounded-lg px-3 py-2 text-base bg-gray-50 text-gray-600">{formData.projectCode || '코드 자동생성'}</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">알파벳 입력 시 자동으로 코드가 생성돼요</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium">프로젝트 코드</label>
                        <input value={formData.projectCode} className={`${inputClass} bg-gray-100`} disabled />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">앨범 자켓 이미지</label>
                      <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      {coverImageFile && (
                        <img src={URL.createObjectURL(coverImageFile)} className="w-20 h-20 rounded-lg object-cover mt-2" />
                      )}
                      {!coverImageFile && formData.coverImageUrl && (
                        <img src={formData.coverImageUrl} className="w-20 h-20 rounded-lg object-cover mt-2" />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">의뢰인 선택</label>
                      <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className={inputClass} placeholder="이름/소속사/아티스트 검색" />
                      {clientSearch && filteredClients.length > 0 && (
                        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {filteredClients.map((c) => (
                            <div key={c.id} onClick={async () => { 
                              setFormData(prev => ({...prev, selectedClientId: c.client_id, clientName: c.name, artistName: c.artist ?? ''}))
                              setClientSearch(`${c.name} - ${c.company ?? ''} ${c.artist ? `(${c.artist})` : ''} [${c.client_id}]`)
                              // 아티스트 목록 불러오기
                              const res = await fetch(`/api/artists?client_id=${c.client_id}`)
                              const data = await res.json()
                              setArtistList(data ?? [])
                            }} className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${formData.selectedClientId === c.client_id ? 'bg-blue-50' : ''}`}>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.company} {c.artist ? `· ${c.artist}` : ''} [{c.client_id}]</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {formData.selectedClientId && <p className="text-xs text-green-600 mt-1">✅ 선택된 의뢰인 코드: {formData.selectedClientId}</p>}
                    </div>
                    {formData.selectedClientId && artistList.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">아티스트 선택</label>
                        <select value={formData.artistName} onChange={(e) => setFormData(prev => ({...prev, artistName: e.target.value}))} className={inputClass}>
                          <option value="">아티스트 선택</option>
                          {artistList.map((a) => (
                            <option key={a.id} value={a.artist_name}>{a.artist_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">노래제목</label>
                      <input value={formData.songTitle} onChange={(e) => setFormData(prev => ({...prev, songTitle: e.target.value}))} className={inputClass} placeholder="노래제목 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">인스타그램 음원 URL</label>
                      <input value={formData.instagramAudioId} onChange={(e) => {
                        const match = e.target.value.match(/reels\/audio\/(\d+)/)
                        setFormData(prev => ({...prev, instagramAudioId: match ? match[1] : e.target.value}))
                      }} className={inputClass} placeholder="https://www.instagram.com/reels/audio/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">틱톡 음원 URL</label>
                      <input value={formData.tiktokAudioId} onChange={(e) => {
                        setFormData(prev => ({...prev, tiktokAudioId: e.target.value}))
                      }} className={inputClass} placeholder="https://www.tiktok.com/music/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">유튜브 음원 URL</label>
                      <input value={formData.youtubeAudioId} onChange={(e) => {
                        const watchMatch = e.target.value.match(/[?&]v=([^&]+)/)
                        const sourceMatch = e.target.value.match(/source\/([^/]+)\/shorts/)
                        setFormData(prev => ({...prev, youtubeAudioId: watchMatch ? watchMatch[1] : sourceMatch ? sourceMatch[1] : e.target.value}))
                      }} className={inputClass} placeholder="https://youtube.com/source/ID/shorts 또는 watch?v=..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">상품내용</label>
                      {products.length > 0 ? (
                        <select value={formData.productContent} onChange={(e) => {
                          setFormData(prev => ({...prev, productContent: e.target.value,
                            refreshInterval: (e.target.value.includes('스탠다드') || e.target.value.includes('디럭스')) ? '12' :
                              (e.target.value.includes('프리미엄') || e.target.value.includes('메가')) ? '6' : prev.refreshInterval,
                            requiredPosts: (e.target.value.includes('스탠다드 30') || e.target.value.includes('스탠다드30')) ? '1' : prev.requiredPosts,
                          }))
                        }} className={inputClass}>
                          <option value="">상품 선택</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>{p.name} ({p.price?.toLocaleString()}P)</option>
                          ))}
                          <option value="__direct__">직접 입력</option>
                        </select>
                      ) : (
                        <input value={formData.productContent} onChange={(e) => setFormData(prev => ({...prev, productContent: e.target.value}))} className={inputClass} placeholder="상품내용 입력" />
                      )}
                      {formData.productContent === '__direct__' && (
                        <input value="" onChange={(e) => setFormData(prev => ({...prev, productContent: e.target.value}))} className={`${inputClass} mt-2`} placeholder="직접 입력" autoFocus />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">추가 옵션명 (선택)</label>
                      <input value={formData.optionName} onChange={(e) => setFormData(prev => ({...prev, optionName: e.target.value}))} className={inputClass} placeholder="예: 숏츠 3개 추가" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">추가 옵션 가격 (선택)</label>
                      <input type="number" value={formData.optionPrice} onChange={(e) => setFormData(prev => ({...prev, optionPrice: e.target.value}))} className={inputClass} placeholder="옵션 가격 입력" />
                    </div>
                    <div>
                      {/* 유튜브 링크 */}
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">댓글 부스팅 유튜브 링크</label>
                        <button onClick={() => setFormData(prev => ({...prev, projectLinks: [...prev.projectLinks, { platform: 'youtube_shorts', url: '', isNew: true }]}))} className="text-xs bg-red-600 text-white px-2 py-1 rounded">+ 추가</button>
                      </div>
                      {formData.projectLinks.filter((l: any) => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(l.platform)).map((link: any, i: any) => {
                        const realIdx = formData.projectLinks.indexOf(link)
                        return (
                          <div key={i} className="flex gap-2 mt-2 items-center">
                            <select value={link.platform} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].platform = e.target.value
                              setFormData(prev => ({...prev, projectLinks: newLinks}))
                            }} className="border rounded-lg px-2 py-2 text-base box-border">
                              <option value="youtube_shorts">유튜브 숏츠</option>
                              <option value="youtube_long">유튜브 영상</option>
                              <option value="youtube_lyric">리릭영상</option>
                              <option value="playlist">플레이리스트</option>
                            </select>
                            <input value={link.url} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].url = e.target.value
                              setFormData(prev => ({...prev, projectLinks: newLinks}))
                            }} className="flex-1 border rounded-lg px-3 py-2 text-base box-border" placeholder="URL 입력" />
                            <button onClick={async () => {
                              if (!link.isNew && link.id) await fetch(`/api/project_links?id=${link.id}`, { method: 'DELETE' })
                              setFormData(prev => ({...prev, projectLinks: formData.projectLinks.filter((_, idx) => idx !== realIdx)}))
                            }} className="text-red-400 text-xs px-2 py-1 border border-red-300 rounded">삭제</button>
                          </div>
                        )
                      })}

                      {/* 인스타/틱톡 링크 */}
                      <div className="flex justify-between items-center mb-2 mt-4">
                        <label className="text-sm font-medium">인스타/틱톡 링크</label>
                        <button onClick={() => setFormData(prev => ({...prev, projectLinks: [...prev.projectLinks, { platform: 'instagram', url: '', isNew: true }]}))} className="text-xs bg-pink-600 text-white px-2 py-1 rounded">+ 추가</button>
                      </div>
                      {formData.projectLinks.filter((l: any) => ['instagram', 'tiktok'].includes(l.platform)).map((link: any, i: any) => {
                        const realIdx = formData.projectLinks.indexOf(link)
                        return (
                          <div key={i} className="flex gap-2 mt-2 items-center">
                            <select value={link.platform} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].platform = e.target.value
                              setFormData(prev => ({...prev, projectLinks: newLinks}))
                            }} className="border rounded-lg px-2 py-2 text-base box-border">
                              <option value="instagram">인스타그램</option>
                              <option value="tiktok">틱톡</option>
                            </select>
                            <input value={link.url} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].url = e.target.value
                              setFormData(prev => ({...prev, projectLinks: newLinks}))
                            }} className="flex-1 border rounded-lg px-3 py-2 text-base box-border" placeholder="URL 입력" />
                            <button onClick={async () => {
                              if (!link.isNew && link.id) await fetch(`/api/project_links?id=${link.id}`, { method: 'DELETE' })
                              setFormData(prev => ({...prev, projectLinks: formData.projectLinks.filter((_, idx) => idx !== realIdx)}))
                            }} className="text-red-400 text-xs px-2 py-1 border border-red-300 rounded">삭제</button>
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <label className="text-sm font-medium">새로고침 주기 (추가 옵션)</label>
                      <select value={formData.refreshInterval} onChange={(e) => setFormData(prev => ({...prev, refreshInterval: e.target.value}))} className={inputClass}>
                        <option value="12">기본 트래픽 - 일 2회 / 12시간 주기</option>
                        <option value="6" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>실버 트래픽 - 일 4회 / 6시간 주기 (150,000원)</option>
                        <option value="3" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>골드 트래픽 - 일 8회 / 3시간 주기 (300,000원)</option>
                        <option value="1" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>다이아 VIP - 일 24회 / 1시간 주기 (800,000원)</option>
                      </select>
                      {(formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')) && (
                        <p className="text-xs text-red-400 mt-1">스탠다드 30은 트래픽 추가가 불가합니다. (기본 트래픽 일 2회 적용)</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">모니터링 기간 연장 (추가 옵션)</label>
                      <select value={formData.monitoringExtension} onChange={(e) => {
                        const days = Number(e.target.value)
                        setFormData(prev => ({...prev, monitoringExtension: days}))
                        if (formData.startDate) {
                          const end = new Date(formData.startDate)
                          end.setDate(end.getDate() + 15 + days)
                          setFormData(prev => ({...prev, monitoringExtension: days, endDate: end.toISOString().split('T')[0]}))
                        }
                      }} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="15">15일 연장 (200,000원)</option>
                        <option value="30">30일 연장 (400,000원)</option>
                        <option value="45">45일 연장 (600,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">커버영상 옵션 (추가 옵션)</label>
                      <select value={formData.coverVideoCount} onChange={(e) => setFormData(prev => ({...prev, coverVideoCount: Number(e.target.value)}))} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="10">10개 (1,500,000원)</option>
                        <option value="20">20개 (3,000,000원)</option>
                        <option value="30">30개 (4,500,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">요청 게시물 수 (추가 옵션)</label>
                      <select value={formData.requiredPosts} onChange={(e) => setFormData(prev => ({...prev, requiredPosts: e.target.value}))} className={inputClass}
                        disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>
                        <option value="1">1개</option>
                        <option value="2">2개 (+상품금액의 50%)</option>
                      </select>
                      {(formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')) && (
                        <p className="text-xs text-red-400 mt-1">스탠다드 30은 게시물 추가가 불가합니다.</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">모집인원</label>
                      <input type="number" value={formData.maxParticipants} onChange={(e) => setFormData(prev => ({...prev, maxParticipants: e.target.value}))} className={inputClass} placeholder="모집 인원 수 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">모집일</label>
                      <div className="flex gap-2">
                        <input type="date" value={formData.missionDate} onChange={(e) => setFormData(prev => ({...prev, missionDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                        <select value={formData.missionTime} onChange={(e) => setFormData(prev => ({...prev, missionTime: e.target.value}))} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">요청사항</label>
                      <textarea value={formData.requirements} onChange={(e) => setFormData(prev => ({...prev, requirements: e.target.value}))} className={inputClass} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">프로젝트 상태</label>
                      <select value={formData.status} onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))} className={inputClass}>
                        <option value="PENDING">대기중</option>
                        <option value="ONGOING">진행중</option>
                        <option value="COMPLETED">완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">시작일</label>
                      <div className="flex gap-2">
                        <input type="date" value={formData.startDate} onChange={(e) => {
                          if (e.target.value) {
                            const end = new Date(e.target.value)
                            end.setDate(end.getDate() + 15 + Number(formData.monitoringExtension))
                            setFormData(prev => ({...prev, startDate: e.target.value, endDate: end.toISOString().split('T')[0]}))
                          } else {
                            setFormData(prev => ({...prev, startDate: e.target.value}))
                          }
                        }} className={inputClass} style={dateInputStyle} />
                        <select value={formData.startTime} onChange={(e) => {
                          setFormData(prev => ({...prev, startTime: e.target.value, endTime: e.target.value}))
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
                        <input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                        <select value={formData.endTime} onChange={(e) => setFormData(prev => ({...prev, endTime: e.target.value}))} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {Number(formData.requiredPosts) === 2 && (
                      <div>
                        <label className="text-sm font-medium">2차 게시물 날짜</label>
                        <div className="flex gap-2">
                          <input type="date" value={formData.secondPostDate} onChange={(e) => setFormData(prev => ({...prev, secondPostDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                          <select value={formData.secondPostTime} onChange={(e) => setFormData(prev => ({...prev, secondPostTime: e.target.value}))} className={inputClass}>
                            <option value="">시간 선택</option>
                            {Array.from({length: 24}, (_, i) => (
                              <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">게시물당 금액 (체험단 지급)</label>
                      <input type="number" value={formData.rewardPerPost} onChange={(e) => setFormData(prev => ({...prev, rewardPerPost: e.target.value}))} className={inputClass} placeholder="기본값: 2,500원" />
                      <p className="text-xs text-gray-400 mt-1">※ 미입력 시 기본값 2,500원으로 등록됩니다</p>
                    </div>
                    <div>
                      {selectedProject ? (
                        <>
                          <button onClick={handleUpdate} disabled={isSaving} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium mb-2 disabled:bg-gray-400">{isSaving ? '저장 중...' : '정보 수정하기'}</button>
                          <button onClick={async () => {
                            if (!formData.selectedClientId) { showToast('의뢰인을 선택해주세요.'); return }
                            
                            // 총비용 계산
                            const totalCost = getTotalCost()
                            const optionsText = [
                              formData.refreshInterval ? ({'12':'기본 트래픽','6':'실버 트래픽','3':'골드 트래픽','1':'다이아 VIP'} as any)[String(formData.refreshInterval)] : '',
                              Number(formData.monitoringExtension) > 0 ? `모니터링 ${formData.monitoringExtension}일 연장` : '',
                              Number(formData.coverVideoCount) > 0 ? `커버영상 ${formData.coverVideoCount}개` : '',
                              Number(formData.requiredPosts) > 1 ? `게시물 ${formData.requiredPosts}개` : '',
                              formData.optionName || ''
                            ].filter(Boolean).join(' / ')
                            const confirmed = confirm(
                              `계약서를 발송하시겠어요?\n\n` +
                              `의뢰인: ${formData.clientName}\n` +
                              `가수명: ${formData.artistName || '-'}\n` +
                              `곡명: ${formData.songTitle}\n` +
                              `상품: ${formData.productContent}${optionsText ? ` + ${optionsText}` : ''}\n` +
                              `계약금액: ${totalCost.toLocaleString()}원\n` +
                              `계약기간: ${formData.startDate} ~ ${formData.endDate}\n\n` +
                              `위 내용으로 계약서를 발송합니다.`
                            )
                            if (!confirmed) return

                            const clientRes = await fetch(`/api/users?client_id=${formData.selectedClientId}`)
                            const clientData = await clientRes.json()
                            const client = clientData?.[0]
                            if (!client) { showToast('의뢰인 정보를 찾을 수 없어요.'); return }
                            
                            const res = await fetch('/api/eformsign?action=send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clientName: formData.clientName,
                                clientEmail: client.email,
                                clientMobile: client.mobile,
                                projectCode: formData.projectCode.toUpperCase(),
                                productContent: formData.productContent,
                                songTitle: formData.songTitle,
                                totalCost: totalCost,
                                startDate: formData.startDate,
                                endDate: formData.endDate,
                                artistName: formData.artistName,
                                optionName: formData.optionName,
                                refreshInterval: formData.refreshInterval,
                                monitoringExtension: formData.monitoringExtension,
                                coverVideoCount: formData.coverVideoCount,
                                requiredPosts: formData.requiredPosts
                              })
                            })
                            const data = await res.json()
                            console.log('eformsign result:', JSON.stringify(data))
                            if (data.success) {
                              await fetch(`/api/projects?project_code=${formData.projectCode.toUpperCase()}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ document_id: data.document_id, total_cost: totalCost })
                              })
                              // 의뢰인에게 푸시
                              const clientTokensRes = await fetch(`/api/push_tokens?user_id=${String(client.id)}`)
                              const clientTokens = await clientTokensRes.json()
                              if (clientTokens && clientTokens.length > 0) {
                                await fetch('/api/push', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: '📄 계약서가 발송됐어요!',
                                    body: '계약서를 확인하고 서명해주세요.',
                                    data: { url: '/client' },
                                    tokens: clientTokens.map((t: any) => t.token),
                                    userIds: [String(client.id)]
                                  })
                                })
                              }
                              showToast('계약서 발송 완료!')
                            } else {
                              showToast('계약서 발송 실패!')
                            }
                          }} className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium">📄 계약서 발송</button>
                        </>
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
                <AdminParticipantList
                  participants={participants}
                  selectedParticipantId={selectedParticipantId}
                  setSelectedParticipantId={setSelectedParticipantId}
                  participantPage={participantPage}
                  setParticipantPage={setParticipantPage}
                  PAGE_SIZE={PAGE_SIZE}
                  onCancelParticipation={handleCancelParticipation}
                />
              </div>
            )}

            {selectedProject && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <AdminPostList
                  posts={posts}
                  selectedParticipantId={selectedParticipantId}
                  adminPostPage={adminPostPage}
                  setAdminPostPage={setAdminPostPage}
                  PAGE_SIZE={PAGE_SIZE}
                  updatingPostId={updatingPostId}
                  isUpdatingLikes={isUpdatingLikes}
                  onUpdateAllLikes={handleUpdateProjectLikes}
                  onUpdateSingleLike={handleUpdateSingleLike}
                  onConvertCover={handleConvertCover}
                  onDeletePost={handleDeletePost}
                  onUrlEdit={(post) => {
                    const newUrl = prompt('새 URL을 입력해주세요:', post.post_url)
                    if (newUrl) { fetch(`/api/posts?id=${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_url: newUrl }) }).then(() => { showToast('수정 완료!'); fetchPosts(selectedProject.project_code) }) }
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      <AdminBottomNav active="admin" />
    </div>
    </>
  )
}