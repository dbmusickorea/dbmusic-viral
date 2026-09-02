'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { ArrowLeft, Trash2, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'

const OPTIONS = [
  { key: 'lyric_video_youtube', type: 'lyric_video', platform: 'youtube', label: '리릭비디오' },
  { key: 'shorts_youtube', type: 'shorts', platform: 'youtube', label: '유튜브 숏츠' },
  { key: 'shorts_instagram', type: 'shorts', platform: 'instagram', label: '인스타그램 릴스' },
  { key: 'shorts_tiktok', type: 'shorts', platform: 'tiktok', label: '틱톡' },
]

const getOptionKey = (type: string, platform: string) => OPTIONS.find(o => o.type === type && o.platform === platform)?.key ?? OPTIONS[0].key
const getPlatformIconKey = (type: string, platform: string) => type === 'shorts' && platform === 'youtube' ? 'youtube_shorts' : platform

export default function DistributionAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'requests' | 'albums'>('requests')

  // --- 발매 신청 관리 ---
  const [requests, setRequests] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  const fetchRequests = async () => {
    setRequestsLoading(true)
    const res = await fetchWithAuth('/api/distribution-release-requests')
    const data = await res.json()
    setRequests(Array.isArray(data) ? data : [])
    setRequestsLoading(false)
  }

  const handleApprove = async (id: number) => {
    if (!confirm('승인하시겠어요? 승인하면 앨범이 자동으로 생성돼요.')) return
    await fetchWithAuth(`/api/distribution-release-requests?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' })
    })
    fetchRequests()
  }

  const handleReject = async (id: number) => {
    if (!confirm('거절하시겠어요?')) return
    await fetchWithAuth(`/api/distribution-release-requests?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' })
    })
    fetchRequests()
  }

  // --- 의뢰인 목록 / 유통 ON-OFF ---
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // --- 의뢰인 선택 후: 앨범 목록 ---
  const [clientAlbums, setClientAlbums] = useState<any[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)

  // --- 앨범 기본정보 편집 ---
  const [albumGenre, setAlbumGenre] = useState('')
  const [albumType, setAlbumType] = useState('SINGLE')
  const [albumIntro, setAlbumIntro] = useState('')
  const [albumUpcEan, setAlbumUpcEan] = useState('')
  const [albumCoverUrl, setAlbumCoverUrl] = useState('')
  const [albumReleaseDate, setAlbumReleaseDate] = useState('')

  // --- 트랙 ---
  const [tracks, setTracks] = useState<any[]>([])
  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null)
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null)
  const [tDisc, setTDisc] = useState('1')
  const [tTrackNum, setTTrackNum] = useState('1')
  const [tVersion, setTVersion] = useState('Original')
  const [tName, setTName] = useState('')
  const [tGenre, setTGenre] = useState('')
  const [tLyrics, setTLyrics] = useState('')
  const [tIsrc, setTIsrc] = useState('')
  const [tUci, setTUci] = useState('')

  // --- 트랙 참여자 ---
  const [creditName, setCreditName] = useState('')
  const [creditRole, setCreditRole] = useState('아티스트')

  // --- 음원 파일 ---
  const [audioFileName, setAudioFileName] = useState('')
  const [audioDuration, setAudioDuration] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  // --- 발매 링크 ---
  const [storePlatform, setStorePlatform] = useState('')
  const [storeUrl, setStoreUrl] = useState('')

  // --- 기존 링크 관리(레거시) ---
  const [items, setItems] = useState<any[]>([])
  const [optionKey, setOptionKey] = useState(OPTIONS[0].key)
  const [itemUrl, setItemUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchClients()
    fetchRequests()
  }, [])

  const fetchClients = async () => {
    setLoading(true)
    const res = await fetchWithAuth('/api/users?role=client')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const toggleDistribution = async (client: any) => {
    await fetchWithAuth(`/api/users?id=${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ has_distribution: !client.has_distribution })
    })
    fetchClients()
  }

  const openClient = async (client: any) => {
    setSelectedClient(client)
    setSelectedAlbum(null)
    resetForm()
    const [itemsRes, albumsRes] = await Promise.all([
      fetchWithAuth(`/api/distribution-items?client_id=${client.id}`),
      fetchWithAuth(`/api/distribution-albums?client_id=${client.id}`),
    ])
    const itemsData = await itemsRes.json()
    const albumsData = await albumsRes.json()
    setItems(Array.isArray(itemsData) ? itemsData : [])
    setClientAlbums(Array.isArray(albumsData) ? albumsData : [])
  }

  const openAlbum = async (album: any) => {
    setSelectedAlbum(album)
    setAlbumGenre(album.genre ?? '')
    setAlbumType(album.album_type ?? 'SINGLE')
    setAlbumIntro(album.album_intro ?? '')
    setAlbumUpcEan(album.upc_ean ?? '')
    setAlbumCoverUrl(album.cover_image_url ?? '')
    setAlbumReleaseDate(album.release_date ? String(album.release_date).slice(0, 10) : '')
    resetTrackForm()
    setExpandedTrackId(null)
    const res = await fetchWithAuth(`/api/distribution-tracks?album_id=${album.id}`)
    const data = await res.json()
    setTracks(Array.isArray(data) ? data : [])
  }

  const handleSaveAlbumInfo = async () => {
    if (!selectedAlbum) return
    await fetchWithAuth(`/api/distribution-albums?id=${selectedAlbum.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre: albumGenre || null,
        album_type: albumType,
        album_intro: albumIntro || null,
        upc_ean: albumUpcEan || null,
        cover_image_url: albumCoverUrl || null,
        release_date: albumReleaseDate || null,
      })
    })
    alert('앨범 정보가 저장됐어요.')
    if (selectedClient) openClient(selectedClient)
  }

  const resetTrackForm = () => {
    setEditingTrackId(null)
    setTDisc('1'); setTTrackNum('1'); setTVersion('Original')
    setTName(''); setTGenre(''); setTLyrics(''); setTIsrc(''); setTUci('')
  }

  const startEditTrack = (track: any) => {
    setEditingTrackId(track.id)
    setTDisc(String(track.disc_number ?? 1))
    setTTrackNum(String(track.track_number ?? 1))
    setTVersion(track.version ?? 'Original')
    setTName(track.track_name ?? '')
    setTGenre(track.genre ?? '')
    setTLyrics(track.lyrics ?? '')
    setTIsrc(track.isrc ?? '')
    setTUci(track.uci ?? '')
  }

  const handleSaveTrack = async () => {
    if (!tName.trim() || !selectedAlbum) return
    const body = {
      album_id: selectedAlbum.id,
      disc_number: Number(tDisc) || 1,
      track_number: Number(tTrackNum) || 1,
      version: tVersion,
      track_name: tName.trim(),
      genre: tGenre || null,
      lyrics: tLyrics || null,
      isrc: tIsrc || null,
      uci: tUci || null,
    }
    if (editingTrackId) {
      await fetchWithAuth(`/api/distribution-tracks?id=${editingTrackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } else {
      await fetchWithAuth('/api/distribution-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }
    resetTrackForm()
    openAlbum(selectedAlbum)
  }

  const handleDeleteTrack = async (id: number) => {
    if (!confirm('트랙을 삭제하시겠어요?')) return
    await fetchWithAuth(`/api/distribution-tracks?id=${id}`, { method: 'DELETE' })
    openAlbum(selectedAlbum)
  }

  const handleAddCredit = async (trackId: number) => {
    if (!creditName.trim()) return
    await fetchWithAuth('/api/distribution-track-credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, name: creditName.trim(), role: creditRole })
    })
    setCreditName('')
    openAlbum(selectedAlbum)
  }

  const handleDeleteCredit = async (id: number) => {
    await fetchWithAuth(`/api/distribution-track-credits?id=${id}`, { method: 'DELETE' })
    openAlbum(selectedAlbum)
  }

  const handleAddAudioFile = async (trackId: number) => {
    if (!audioFileName.trim()) return
    await fetchWithAuth('/api/distribution-audio-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, file_name: audioFileName.trim(), duration: audioDuration || null, file_url: audioUrl || null })
    })
    setAudioFileName(''); setAudioDuration(''); setAudioUrl('')
    openAlbum(selectedAlbum)
  }

  const handleDeleteAudioFile = async (id: number) => {
    await fetchWithAuth(`/api/distribution-audio-files?id=${id}`, { method: 'DELETE' })
    openAlbum(selectedAlbum)
  }

  const handleAddStoreLink = async () => {
    if (!storePlatform.trim() || !storeUrl.trim() || !selectedAlbum) return
    await fetchWithAuth('/api/distribution-store-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ album_id: selectedAlbum.id, platform_name: storePlatform.trim(), url: storeUrl.trim() })
    })
    setStorePlatform(''); setStoreUrl('')
    if (selectedClient) {
      const res = await fetchWithAuth(`/api/distribution-albums?id=${selectedAlbum.id}`)
      const data = await res.json()
      const updated = Array.isArray(data) ? data[0] : data
      if (updated) setSelectedAlbum(updated)
    }
  }

  const handleDeleteStoreLink = async (id: number) => {
    await fetchWithAuth(`/api/distribution-store-links?id=${id}`, { method: 'DELETE' })
    if (selectedAlbum) {
      const res = await fetchWithAuth(`/api/distribution-albums?id=${selectedAlbum.id}`)
      const data = await res.json()
      const updated = Array.isArray(data) ? data[0] : data
      if (updated) setSelectedAlbum(updated)
    }
  }

  // --- 기존 링크 관리(레거시) ---
  const resetForm = () => {
    setEditingId(null)
    setOptionKey(OPTIONS[0].key)
    setItemUrl('')
    setSongTitle('')
    setArtistName('')
  }

  const startEdit = (item: any) => {
    setEditingId(item.id)
    setOptionKey(getOptionKey(item.type, item.platform))
    setItemUrl(item.url ?? '')
    setSongTitle(item.song_title ?? '')
    setArtistName(item.artist_name ?? '')
  }

  const handleSubmit = async () => {
    if (!itemUrl.trim() || !selectedClient) return
    const option = OPTIONS.find(o => o.key === optionKey) ?? OPTIONS[0]
    const body = {
      client_id: selectedClient.id,
      type: option.type,
      platform: option.platform,
      url: itemUrl.trim(),
      song_title: songTitle.trim() || null,
      artist_name: artistName.trim() || null,
    }
    if (editingId) {
      await fetchWithAuth(`/api/distribution-items?id=${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } else {
      await fetchWithAuth('/api/distribution-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }
    resetForm()
    openClient(selectedClient)
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm('삭제하시겠어요?')) return
    await fetchWithAuth(`/api/distribution-items?id=${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    if (selectedClient) openClient(selectedClient)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-4">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/admin-mypage')} className="text-gray-600 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold dark:text-white">유통 서비스 관리</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('requests')} className={`flex-1 py-2 text-sm rounded-lg font-medium ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>
            발매 신청 관리 {requests.filter(r => r.status === 'PENDING').length > 0 && `(${requests.filter(r => r.status === 'PENDING').length})`}
          </button>
          <button onClick={() => setActiveTab('albums')} className={`flex-1 py-2 text-sm rounded-lg font-medium ${activeTab === 'albums' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>
            앨범/링크 관리
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            {requestsLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" /></div>
            ) : requests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">발매 신청 내역이 없어요.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((r: any) => (
                  <div key={r.id} className="border dark:border-gray-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold dark:text-white">{r.album_name}</p>
                        <p className="text-xs text-gray-400">{r.participating_artists}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.status === 'PENDING' ? '검토중' : r.status === 'APPROVED' ? '승인됨' : '거절됨'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      <p>발매 희망일: {r.release_desired_date} {r.release_desired_time}</p>
                      <p>자료 완성일: {r.material_complete_date}</p>
                      {r.artist_streaming_url && <p className="break-all">아티스트 URL: {r.artist_streaming_url}</p>}
                      {r.attachment_url && <p className="break-all">첨부파일: {r.attachment_url}</p>}
                      <p>MV 포함: {r.has_mv ? 'Yes' : 'No'}</p>
                      {r.inquiry && <p>문의: {r.inquiry}</p>}
                    </div>
                    {r.status === 'PENDING' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleApprove(r.id)} className="flex-1 text-xs bg-blue-600 text-white rounded-lg py-2">승인 (앨범 자동생성)</button>
                        <button onClick={() => handleReject(r.id)} className="flex-1 text-xs border dark:border-gray-500 dark:text-gray-300 rounded-lg py-2">거절</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'albums' && (
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-1/3 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="font-bold dark:text-white mb-3">의뢰인 목록</h2>
              {clients.length === 0 ? (
                <p className="text-xs text-gray-400">의뢰인이 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {clients.map(client => (
                    <div key={client.id} className={`rounded-lg p-3 cursor-pointer ${selectedClient?.id === client.id ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-700'}`} onClick={() => openClient(client)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium dark:text-white">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.email}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleDistribution(client) }} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${client.has_distribution ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-300'}`}>
                          {client.has_distribution ? '유통 ON' : '유통 OFF'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <h2 className="font-bold dark:text-white mb-3">{selectedClient.name} - 앨범 목록</h2>
                {clientAlbums.length === 0 ? (
                  <p className="text-xs text-gray-400">등록된 앨범이 없어요.</p>
                ) : (
                  <div className="space-y-2">
                    {clientAlbums.map((album: any) => (
                      <button key={album.id} onClick={() => openAlbum(album)} className={`w-full text-left rounded-lg p-3 ${selectedAlbum?.id === album.id ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <p className="text-sm font-medium dark:text-white">{album.album_name}</p>
                        <p className="text-xs text-gray-400">{album.album_type} · {album.release_date ? new Date(album.release_date).toLocaleDateString('ko-KR') : '발매일 미정'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            {!selectedClient ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <p className="text-xs text-gray-400">왼쪽에서 의뢰인을 선택해주세요.</p>
              </div>
            ) : selectedAlbum ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold dark:text-white">{selectedAlbum.album_name} - 기본정보</h2>
                    <button onClick={() => setSelectedAlbum(null)} className="text-xs text-gray-400 flex items-center gap-0.5"><X size={14} /> 닫기</button>
                  </div>
                  <div className="space-y-2">
                    <input value={albumGenre} onChange={(e) => setAlbumGenre(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="장르 (예: Ballad)" />
                    <select value={albumType} onChange={(e) => setAlbumType(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                      <option value="SINGLE">SINGLE</option>
                      <option value="EP">EP</option>
                      <option value="FULL">정규</option>
                    </select>
                    <input type="date" value={albumReleaseDate} onChange={(e) => setAlbumReleaseDate(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                    <input value={albumUpcEan} onChange={(e) => setAlbumUpcEan(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="UPC/EAN" />
                    <input value={albumCoverUrl} onChange={(e) => setAlbumCoverUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="앨범 자켓 이미지 URL" />
                    <textarea value={albumIntro} onChange={(e) => setAlbumIntro(e.target.value)} rows={3} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="앨범소개" />
                    <button onClick={handleSaveAlbumInfo} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">기본정보 저장</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">{editingTrackId ? '트랙 수정' : '트랙 추가'}</h2>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={tDisc} onChange={(e) => setTDisc(e.target.value)} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="Disc 번호" />
                    <input value={tTrackNum} onChange={(e) => setTTrackNum(e.target.value)} className="border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="Track 번호" />
                  </div>
                  <div className="space-y-2">
                    <input value={tVersion} onChange={(e) => setTVersion(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="버전 (Original, Inst. 등)" />
                    <input value={tName} onChange={(e) => setTName(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="트랙명" />
                    <input value={tGenre} onChange={(e) => setTGenre(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="장르" />
                    <input value={tIsrc} onChange={(e) => setTIsrc(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="ISRC" />
                    <input value={tUci} onChange={(e) => setTUci(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="UCI" />
                    <textarea value={tLyrics} onChange={(e) => setTLyrics(e.target.value)} rows={4} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="가사" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveTrack} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">{editingTrackId ? '수정 완료' : '트랙 추가'}</button>
                      {editingTrackId && <button onClick={resetTrackForm} className="px-4 border dark:border-gray-600 dark:text-gray-300 rounded-lg text-sm">취소</button>}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">트랙 목록</h2>
                  {tracks.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 트랙이 없어요.</p>
                  ) : (
                    <div className="space-y-2">
                      {tracks.map((track: any) => (
                        <div key={track.id} className="border dark:border-gray-600 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs text-gray-400">Disc.{track.disc_number} - Track.{track.track_number} ({track.version})</p>
                              <p className="text-sm font-medium dark:text-white">{track.track_name}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)} className="text-gray-400">
                                {expandedTrackId === track.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <button onClick={() => startEditTrack(track)} className="text-gray-400"><Pencil size={16} /></button>
                              <button onClick={() => handleDeleteTrack(track.id)} className="text-red-400"><Trash2 size={16} /></button>
                            </div>
                          </div>

                          {expandedTrackId === track.id && (
                            <div className="mt-3 pt-3 border-t dark:border-gray-600 space-y-3">
                              <div>
                                <p className="text-xs font-bold dark:text-white mb-1">참여자</p>
                                {(track.distribution_track_credits ?? []).map((c: any) => (
                                  <div key={c.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1 mb-1">
                                    <span className="dark:text-gray-200">{c.role} - {c.name}</span>
                                    <button onClick={() => handleDeleteCredit(c.id)} className="text-red-400"><X size={12} /></button>
                                  </div>
                                ))}
                                <div className="flex gap-1 mt-1">
                                  <select value={creditRole} onChange={(e) => setCreditRole(e.target.value)} className="border dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-white">
                                    <option>아티스트</option>
                                    <option>피처링</option>
                                    <option>작곡가</option>
                                    <option>작사가</option>
                                    <option>편곡가</option>
                                  </select>
                                  <input value={creditName} onChange={(e) => setCreditName(e.target.value)} className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-white" placeholder="이름" />
                                  <button onClick={() => handleAddCredit(track.id)} className="text-xs bg-blue-600 text-white rounded px-2">추가</button>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-bold dark:text-white mb-1">음원 파일</p>
                                {(track.distribution_audio_files ?? []).map((a: any) => (
                                  <div key={a.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1 mb-1">
                                    <span className="dark:text-gray-200 truncate">{a.file_name} {a.duration ? `(${a.duration})` : ''}</span>
                                    <button onClick={() => handleDeleteAudioFile(a.id)} className="text-red-400 shrink-0"><X size={12} /></button>
                                  </div>
                                ))}
                                <div className="space-y-1 mt-1">
                                  <input value={audioFileName} onChange={(e) => setAudioFileName(e.target.value)} className="w-full border dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-white" placeholder="파일명" />
                                  <div className="flex gap-1">
                                    <input value={audioDuration} onChange={(e) => setAudioDuration(e.target.value)} className="w-20 border dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-white" placeholder="00:00:00" />
                                    <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className="flex-1 border dark:border-gray-600 rounded px-2 py-1 text-xs dark:bg-gray-700 dark:text-white" placeholder="파일 링크(선택)" />
                                    <button onClick={() => handleAddAudioFile(track.id)} className="text-xs bg-blue-600 text-white rounded px-2">추가</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">발매 플랫폼 링크</h2>
                  {(selectedAlbum.distribution_store_links ?? []).map((link: any) => (
                    <div key={link.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 rounded px-2 py-1.5 mb-1">
                      <span className="dark:text-gray-200">{link.platform_name}: <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 break-all">{link.url}</a></span>
                      <button onClick={() => handleDeleteStoreLink(link.id)} className="text-red-400 shrink-0 ml-2"><X size={12} /></button>
                    </div>
                  ))}
                  <div className="flex gap-1 mt-2">
                    <input value={storePlatform} onChange={(e) => setStorePlatform(e.target.value)} className="w-28 border dark:border-gray-600 rounded px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-white" placeholder="플랫폼명" />
                    <input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} className="flex-1 border dark:border-gray-600 rounded px-2 py-1.5 text-xs dark:bg-gray-700 dark:text-white" placeholder="URL" />
                    <button onClick={handleAddStoreLink} className="text-xs bg-blue-600 text-white rounded px-3">추가</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-bold dark:text-white">{selectedClient.name} - {editingId ? '링크 수정' : '링크 등록'}</h2>
                    {editingId && (
                      <button onClick={resetForm} className="text-xs text-gray-400 flex items-center gap-0.5"><X size={14} /> 취소</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <select value={optionKey} onChange={(e) => setOptionKey(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                      {OPTIONS.map(o => (
                        <option key={o.key} value={o.key}>{o.label}</option>
                      ))}
                    </select>
                    <input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="링크 URL" />
                    <input value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="아티스트명 (선택)" />
                    <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="곡명 (선택)" />
                    <button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">{editingId ? '수정 완료' : '등록'}</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">등록된 링크</h2>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 링크가 없어요.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className={`rounded-lg p-3 ${editingId === item.id ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                              <PlatformIcon platform={getPlatformIconKey(item.type, item.platform)} size={18} className="shrink-0" />
                              <div>
                                <p className="text-sm font-medium dark:text-white">
                                  {OPTIONS.find(o => o.key === getOptionKey(item.type, item.platform))?.label}
                                </p>
                                {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400">{item.artist_name} - {item.song_title}</p>}
                                <p className="text-xs text-blue-500 break-all mt-1">{item.url}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0 ml-2">
                              <button onClick={() => startEdit(item)} className="text-gray-400">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="text-red-400">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
