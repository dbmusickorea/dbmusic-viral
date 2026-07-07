'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

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
  const [rewardPerPost, setRewardPerPost] = useState('')
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
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchProjects()
    fetchProducts()
    fetchClients()
    fetchClientRequests()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data ?? [])
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true })
    setProducts(data ?? [])
  }

  const fetchClients = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'client').order('name', { ascending: true })
    setClients(data ?? [])
  }

  const fetchClientRequests = async () => {
    const { data } = await supabase.from('client_requests').select('*').order('created_at', { ascending: false })
    setClientRequests(data ?? [])
  }

  const handleAddProduct = async () => {
    if (!newProduct) { alert('상품명을 입력해주세요.'); return }
    const { error } = await supabase.from('products').insert({ name: newProduct, price: Number(newProductPrice) || 0 })
    if (error) { alert('등록 실패!'); return }
    setNewProduct(''); setNewProductPrice('')
    fetchProducts()
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const fetchPosts = async (code: string) => {
    const { data } = await supabase.from('posts').select('*').eq('project_code', code).order('created_at', { ascending: false })
    setPosts(data ?? [])
  }

  const fetchParticipants = async (code: string) => {
    const { data } = await supabase
      .from('project_participants')
      .select('*, participants(name, mobile, instagram_id, youtube_id, tiktok_id)')
      .ilike('project_code', code)
      .order('joined_at', { ascending: false })
    setParticipants(data ?? [])
  }

  // 알파벳 입력 시 자동으로 프로젝트 코드 생성
  const handlePrefixChange = async (prefix: string) => {
    const upper = prefix.toUpperCase().replace(/[^A-Z]/g, '')
    setProjectPrefix(upper)
    if (!upper) { setProjectCode(''); return }

    // 해당 알파벳으로 시작하는 프로젝트 수 조회
    const { data } = await supabase
      .from('projects')
      .select('project_code')
      .ilike('project_code', `${upper}_%`)

    const nextNum = (data?.length ?? 0) + 1
    setProjectCode(`${upper}_${nextNum}`)
  }

  const handleSelectProject = (project: any) => {
    setSelectedProject(project)
    setClientName(project.client_name ?? '')
    setProjectCode(project.project_code ?? '')
    setProjectPrefix(project.project_code?.split('_')[0] ?? '')
    setProductContent(project.product_content ?? '')
    setRequirements(project.requirements ?? '')
    setStatus(project.status ?? 'ONGOING')
    setStartDate(project.start_date ? project.start_date.substring(0, 10) : '')
    setEndDate(project.end_date ? project.end_date.substring(0, 10) : '')
    setRewardPerPost(project.reward_per_post ?? '')
    setOptionName(project.option_name ?? '')
    setOptionPrice(project.option_price ?? '')
    setSelectedClientId(project.client_id ?? '')
    setShortsUrl1('')
    setShortsUrl2('')
    setPlaylistUrl('')
    setMaxParticipants(project.max_participants ?? '')
    setMissionDate(project.mission_date ?? '')
    setMissionTime(project.mission_time ?? '')
    fetchPosts(project.project_code)
    supabase.from('project_videos').select('*').eq('project_code', project.project_code).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setShortsUrl1(data.shorts_url_1 ?? '')
          setShortsUrl2(data.shorts_url_2 ?? '')
          setPlaylistUrl(data.playlist_url ?? '')
        }
      })
    fetchParticipants(project.project_code)
  }

  const getSelectedProductPrice = () => {
    const product = products.find(p => p.name === productContent)
    return product?.price ?? 0
  }

  const getTotalCost = () => {
    const productPrice = getSelectedProductPrice()
    const option = Number(optionPrice) || 0
    return productPrice + option
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)
    return match?.[1] ?? ''
  }

  const saveProjectVideos = async (projectCode: string) => {
    const existing = await supabase.from('project_videos').select('id').eq('project_code', projectCode).maybeSingle()
    const data = {
      project_code: projectCode,
      shorts_url_1: shortsUrl1 || null,
      shorts_video_id_1: shortsUrl1 ? extractVideoId(shortsUrl1) : null,
      shorts_url_2: shortsUrl2 || null,
      shorts_video_id_2: shortsUrl2 ? extractVideoId(shortsUrl2) : null,
      playlist_url: playlistUrl || null,
      playlist_video_id: playlistUrl ? extractVideoId(playlistUrl) : null,
    }
    if (existing.data) {
      await supabase.from('project_videos').update(data).eq('project_code', projectCode)
    } else {
      await supabase.from('project_videos').insert(data)
    }
  }

  const handleInsert = async () => {
    if (!projectCode) { alert('프로젝트 코드를 입력해주세요.'); return }
    const { error } = await supabase.from('projects').insert({
      project_code: projectCode.toUpperCase(),
      client_name: clientName,
      product_content: productContent,
      requirements,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      reward_per_post: Number(rewardPerPost),
      max_participants: Number(maxParticipants) || 0,
      mission_date: missionDate || null,
      mission_time: missionTime || null,
      option_name: optionName || null,
      option_price: Number(optionPrice) || null,
      client_id: selectedClientId || null
    })
    if (error) { alert('등록 실패!'); return }
    if (selectedClientId) {
      await supabase.from('users').update({ project_code: projectCode.toUpperCase() }).eq('client_id', selectedClientId)
    }
    await saveProjectVideos(projectCode.toUpperCase())
    // 체험단 전체에게 푸시 알림 발송
    const { data: participantTokens } = await supabase.from('push_tokens').select('token').eq('user_role', 'participant')
    if (participantTokens && participantTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎵 새 프로젝트가 등록됐어요!',
          body: `${productContent} 프로젝트가 등록됐어요. 모집일: ${startDate || '미정'}. 앱에서 확인해보세요!`,
          tokens: participantTokens.map((t: any) => t.token)
        })
      })
    }
    alert('등록 완료!')
    fetchProjects()
    fetchClients()
    clearForm()
  }

  const handleUpdate = async () => {
    const { error } = await supabase.from('projects').update({
      client_name: clientName,
      product_content: productContent,
      requirements,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      reward_per_post: Number(rewardPerPost),
      max_participants: Number(maxParticipants) || 0,
      mission_date: missionDate || null,
      mission_time: missionTime || null,
      option_name: optionName || null,
      option_price: Number(optionPrice) || null,
      client_id: selectedClientId || null
    }).eq('project_code', selectedProject.project_code)
    if (error) { alert('수정 실패!'); return }
    if (selectedClientId) {
      await supabase.from('users').update({ project_code: projectCode.toUpperCase() }).eq('client_id', selectedClientId)
    }
    await saveProjectVideos(projectCode.toUpperCase())
    alert('수정 완료!')
    fetchProjects()
    fetchClients()
  }

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) { alert('제목과 내용을 입력해주세요.'); return }
    setIsSendingPush(true)
    
    const { data: tokens } = await supabase.from('push_tokens').select('token')
    if (!tokens || tokens.length === 0) { alert('등록된 푸시 토큰이 없어요.'); setIsSendingPush(false); return }
    
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: pushTitle,
        body: pushBody,
        tokens: tokens.map(t => t.token)
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

  const handleUpdateAllLikes = async () => {
    setIsUpdatingLikes(true)
    const { data: allPosts } = await supabase.from('posts').select('*')
    if (!allPosts) { setIsUpdatingLikes(false); return }

    for (const post of allPosts) {
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
          await supabase.from('posts').update({
            likes_count: stats.likes,
            comments_count: stats.comments
          }).eq('id', post.id)
        }
      } catch { continue }
    }

    setIsUpdatingLikes(false)
    alert('좋아요 수 갱신 완료!')
    if (selectedProject) fetchPosts(selectedProject.project_code)
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
        await supabase.from('posts').update({
          likes_count: stats.likes,
          comments_count: stats.comments
        }).eq('id', post.id)
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
    setPosts([])
    setMaxParticipants(''); setMissionDate(''); setMissionTime('')
    setShortsUrl1(''); setShortsUrl2(''); setPlaylistUrl('')
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">🎵 프로젝트 관리</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          <div className="flex gap-1 mb-2">
            <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
            <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
          </div>
          <button
            onClick={handleUpdateAllLikes}
            disabled={isUpdatingLikes}
            className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-400"
          >
            {isUpdatingLikes ? '갱신 중...' : '🔄 전체 좋아요 수 갱신 (인스타 + 유튜브 + 틱톡)'}
          </button>
        </div>

        {/* 상품 사전 등록 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📦 상품 사전 등록</h2>
            <button onClick={() => setShowProductManager(!showProductManager)} className="text-xs border rounded px-2 py-1">
              {showProductManager ? '닫기' : '관리'}
            </button>
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
                        <p className="text-sm text-blue-600">{p.price?.toLocaleString()}원</p>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 프로젝트 목록 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">프로젝트 목록</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{project.project_code}</p>
                      <p className="text-xs text-gray-500">{project.client_name} · {project.product_content}</p>
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

        {/* 등록/수정 폼 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{selectedProject ? '프로젝트 수정' : '프로젝트 등록'}</h2>
            {selectedProject && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
          </div>

          {(productContent && productContent !== '__direct__') && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500">💰 프로젝트 총비용</p>
              <p className="text-xl font-bold text-blue-600">{getTotalCost().toLocaleString()}원</p>
              <div className="text-xs text-gray-500 mt-1">
                <p>상품: {getSelectedProductPrice().toLocaleString()}원</p>
                {optionPrice && <p>옵션: +{Number(optionPrice).toLocaleString()}원</p>}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* 프로젝트 코드 자동생성 */}
            {!selectedProject ? (
              <div>
                <label className="text-sm font-medium">프로젝트 코드 자동생성</label>
                <div className="flex gap-2 mt-1">
                  <input
                    value={projectPrefix}
                    onChange={(e) => handlePrefixChange(e.target.value)}
                    className="w-20 border rounded-lg px-3 py-2 text-base"
                    placeholder="A"
                    maxLength={3}
                  />
                  <div className="flex-1 border rounded-lg px-3 py-2 text-base bg-gray-50 text-gray-600">
                    {projectCode || '코드 자동생성'}
                  </div>
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
              <label className="text-sm font-medium">의뢰인명</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium">상품내용</label>
              {products.length > 0 ? (
                <select value={productContent} onChange={(e) => setProductContent(e.target.value)} className={inputClass}>
                  <option value="">상품 선택</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>{p.name} ({p.price?.toLocaleString()}원)</option>
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
              <label className="text-sm font-medium">유튜브 쇼츠 1 URL</label>
              <input value={shortsUrl1} onChange={(e) => setShortsUrl1(e.target.value)} className={inputClass} placeholder="https://youtube.com/shorts/..." />
            </div>
            <div>
              <label className="text-sm font-medium">유튜브 쇼츠 2 URL</label>
              <input value={shortsUrl2} onChange={(e) => setShortsUrl2(e.target.value)} className={inputClass} placeholder="https://youtube.com/shorts/..." />
            </div>
            <div>
              <label className="text-sm font-medium">플레이리스트 URL</label>
              <input value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} className={inputClass} placeholder="https://youtube.com/watch?v=..." />
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
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} style={dateInputStyle} />
            </div>
            <div>
              <label className="text-sm font-medium">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} style={dateInputStyle} />
            </div>
            <div>
              <label className="text-sm font-medium">게시물당 금액 (체험단 지급)</label>
              <input type="number" value={rewardPerPost} onChange={(e) => setRewardPerPost(e.target.value)} className={inputClass} />
            </div>
            <div>
              {selectedProject ? (
                <button onClick={handleUpdate} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">정보 수정하기</button>
              ) : (
                <button onClick={handleInsert} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">의뢰인 등록</button>
              )}
            </div>
          </div>
        </div>

        {/* 의뢰인 프로젝트 문의 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📋 의뢰인 프로젝트 문의</h2>
          {clientRequests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">문의 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {clientRequests.map((req) => (
                <div key={req.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{req.title}</p>
                      <p className="text-xs text-gray-500">{req.client_name} · {req.client_mobile} · {new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                      <p className="text-xs text-gray-600 mt-1">{req.content}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 ml-2">
                      <span className={`text-xs px-2 py-1 rounded-full text-center ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {req.status === 'PENDING' ? '검토중' : req.status === 'APPROVED' ? '승인' : '거절'}
                      </span>
                      {req.status === 'PENDING' && (
                        <>
                          <button onClick={async () => {
                            await supabase.from('client_requests').update({ status: 'APPROVED' }).eq('id', req.id)
                            fetchClientRequests()
                          }} className="text-xs bg-green-600 text-white rounded px-2 py-1">승인</button>
                          <button onClick={async () => {
                            await supabase.from('client_requests').update({ status: 'REJECTED' }).eq('id', req.id)
                            fetchClientRequests()
                          }} className="text-xs bg-red-500 text-white rounded px-2 py-1">거절</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸시 알림 발송 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">🔔 푸시 알림 발송</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">제목</label>
              <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="알림 제목" />
            </div>
            <div>
              <label className="text-sm font-medium">내용</label>
              <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="알림 내용" />
            </div>
            <button
              onClick={handleSendPush}
              disabled={isSendingPush}
              className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400"
            >
              {isSendingPush ? '발송 중...' : '전체 발송'}
            </button>
          </div>
        </div>

        {/* 참여자 목록 */}
        {selectedProject && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">👥 참여자 목록 ({participants.length}명)</h2>
            {participants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">참여자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {participants.map((p) => (
                  <div key={p.id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium">{p.participants?.name}</p>
                    <p className="text-xs text-gray-500">📱 {p.participants?.mobile}</p>
                    {p.participants?.instagram_id && <p className="text-xs text-gray-500">📸 {p.participants?.instagram_id}</p>}
                    {p.participants?.youtube_id && <p className="text-xs text-gray-500">🎬 {p.participants?.youtube_id}</p>}
                    {p.participants?.tiktok_id && <p className="text-xs text-gray-500">🎵 {p.participants?.tiktok_id}</p>}
                    <p className="text-xs text-gray-400">참여일: {new Date(p.joined_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 게시물 목록 */}
        {selectedProject && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold mb-3">📋 게시물 목록 ({posts.length}개)</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{post.influencer_name}</p>
                        <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500 block overflow-hidden text-ellipsis whitespace-nowrap">링크 보기 →</a>
                        <button
                          onClick={() => {
                            const newUrl = prompt('새 URL을 입력해주세요:', post.post_url)
                            if (newUrl) {
                              supabase.from('posts').update({ post_url: newUrl }).eq('id', post.id)
                                .then(() => { alert('수정 완료!'); fetchPosts(selectedProject.project_code) })
                            }
                          }}
                          className="text-xs text-orange-500 mt-1 block"
                        >
                          URL 수정
                        </button>
                        <p className="text-xs mt-1">❤️ {post.likes_count?.toLocaleString()} · 💬 {post.comments_count?.toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleUpdateSingleLike(post)} disabled={updatingPostId === post.id} className="text-xs bg-orange-500 text-white rounded px-2 py-1 disabled:bg-gray-400 shrink-0">
                        {updatingPostId === post.id ? '...' : '갱신'}
                      </button>
                    </div>
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