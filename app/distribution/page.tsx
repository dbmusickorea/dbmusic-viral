'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { LayoutGrid, BarChart2, FileText, User, Disc3, RefreshCw, ArrowDown } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'
import BottomNav from '../../components/BottomNav'
import Sidebar from '../../components/Sidebar'

export default function DistributionPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [hasProjects, setHasProjects] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [subTab, setSubTab] = useState<'albums' | 'artists' | 'apply' | 'content'>('albums')

  // 앨범 목록
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null)
  const [artists, setArtists] = useState<any[]>([])
  const [selectedArtist, setSelectedArtist] = useState<any>(null)
  const [albumTracks, setAlbumTracks] = useState<any[]>([])
  const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null)

  // 발매 신청
  const [releaseRequests, setReleaseRequests] = useState<any[]>([])
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [desiredDate, setDesiredDate] = useState('')
  const [desiredTime, setDesiredTime] = useState('12:00')
  const [materialDate, setMaterialDate] = useState('')
  const [albumName, setAlbumName] = useState('')
  const [participatingArtists, setParticipatingArtists] = useState('')
  const [artistStreamingUrl, setArtistStreamingUrl] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [hasMv, setHasMv] = useState<'Y' | 'N'>('N')
  const [inquiry, setInquiry] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      const parsed = JSON.parse(stored)
      await fetchAllData(parsed.id, parsed.client_id)
    }
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    localStorage.removeItem('autoLogin')
    router.push('/')
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const stored = localStorage.getItem('userInfo')
    if (role !== 'client' || !stored) { router.push('/'); return }
    const parsed = JSON.parse(stored)
    if (!parsed.has_distribution) { router.push('/client'); return }

    setUserInfo(parsed)
    fetchAllData(parsed.id, parsed.client_id)
  }, [])

  const fetchAllData = async (userId: number, clientId: string) => {
    const [userRes, itemsRes, projectsRes, albumsRes, requestsRes, artistsRes] = await Promise.all([
      fetchWithAuth(`/api/users?id=${userId}`),
      fetchWithAuth(`/api/distribution-items?client_id=${userId}`),
      fetchWithAuth(`/api/projects?client_id=${clientId}`),
      fetchWithAuth(`/api/distribution-albums?client_id=${userId}`),
      fetchWithAuth(`/api/distribution-release-requests?client_id=${userId}`),
      fetchWithAuth(`/api/distribution-artists?client_id=${userId}`),
    ])

    const userData = await userRes.json()
    const latestUser = Array.isArray(userData) ? userData[0] : userData
    if (!latestUser?.has_distribution) {
      const stored = localStorage.getItem('userInfo')
      const parsed = stored ? JSON.parse(stored) : {}
      const updated = { ...parsed, has_distribution: false }
      localStorage.setItem('userInfo', JSON.stringify(updated))
      router.push('/client')
      return
    }
    const itemsData = await itemsRes.json()
    const projectsData = await projectsRes.json()
    const albumsData = await albumsRes.json()
    const requestsData = await requestsRes.json()
    setItems(Array.isArray(itemsData) ? itemsData : [])
    setHasProjects(Array.isArray(projectsData) && projectsData.length > 0)
    setAlbums(Array.isArray(albumsData) ? albumsData : [])
    setReleaseRequests(Array.isArray(requestsData) ? requestsData : [])
    const artistsData = await artistsRes.json()
    setArtists(Array.isArray(artistsData) ? artistsData : [])
    setDataLoading(false)
  }

  const openAlbumDetail = async (album: any) => {
    setSelectedAlbum(album)
    setExpandedTrackId(null)
    const res = await fetchWithAuth(`/api/distribution-tracks?album_id=${album.id}`)
    const data = await res.json()
    setAlbumTracks(Array.isArray(data) ? data : [])
  }

  const handleSubmitRequest = async () => {
    if (!albumName.trim() || !desiredDate || !materialDate || !attachmentUrl.trim()) {
      alert('필수 항목(*)을 모두 입력해주세요.')
      return
    }
    setSubmitting(true)
    await fetchWithAuth('/api/distribution-release-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: userInfo.id,
        release_desired_date: desiredDate,
        release_desired_time: desiredTime,
        material_complete_date: materialDate,
        album_name: albumName.trim(),
        participating_artists: participatingArtists.trim(),
        artist_streaming_url: artistStreamingUrl.trim() || null,
        attachment_url: attachmentUrl.trim(),
        has_mv: hasMv === 'Y',
        inquiry: inquiry.trim() || null,
      })
    })
    setShowApplyForm(false)
    setDesiredDate(''); setDesiredTime('12:00'); setMaterialDate(''); setAlbumName('')
    setParticipatingArtists(''); setArtistStreamingUrl(''); setAttachmentUrl(''); setHasMv('N'); setInquiry('')
    await fetchAllData(userInfo.id, userInfo.client_id)
    setSubmitting(false)
  }

  const platformLabel = (p: string) => p === 'youtube' ? '유튜브' : p === 'instagram' ? '인스타그램 릴스' : '틱톡'
  const platformIconKey = (type: string, p: string) => type === 'shorts' && p === 'youtube' ? 'youtube_shorts' : p

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          ...(hasProjects ? [
            { icon: '', label: '프로젝트', onClick: () => router.push('/client') },
            { icon: '', label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
            { icon: '', label: '프로젝트 신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
            { icon: '', label: '보고서', onClick: () => router.push('/client-report') },
          ] : []),
          { icon: '', label: '유통 서비스', onClick: () => router.push('/distribution'), active: true },
          { icon: '', label: '마이페이지', onClick: () => router.push('/client-mypage') },
        ]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
        onTouchStart={(e) => {
          if (document.documentElement.scrollTop === 0) setPullStartY(e.touches[0].clientY)
          else setPullStartY(0)
        }}
        onTouchMove={(e) => {
          if (pullStartY === 0) return
          if (e.touches[0].clientY - pullStartY > 70) setIsPulling(true)
        }}
        onTouchEnd={() => {
          if (isPulling) handleRefresh()
          setIsPulling(false)
        }}
        style={{paddingTop: "calc(env(safe-area-inset-top) + 1rem)"}}>
        <div className="max-w-7xl mx-auto">
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
              {isRefreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
              ) : (
                <><ArrowDown size={14} /> 놓으면 새로고침</>
              )}
            </div>
          )}
          <div className="flex justify-center mb-2">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => { if (hasProjects) router.push('/client'); else window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold dark:text-white">{userInfo?.name}님의 유통 서비스</h1>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setSubTab('albums')} className={`flex-1 py-2 text-xs rounded-lg font-medium ${subTab === 'albums' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>앨범</button>
            <button onClick={() => setSubTab('artists')} className={`flex-1 py-2 text-xs rounded-lg font-medium ${subTab === 'artists' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>아티스트</button>
            <button onClick={() => setSubTab('apply')} className={`flex-1 py-2 text-xs rounded-lg font-medium ${subTab === 'apply' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>발매 신청</button>
            <button onClick={() => setSubTab('content')} className={`flex-1 py-2 text-xs rounded-lg font-medium ${subTab === 'content' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>콘텐츠</button>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              {subTab === 'albums' && !selectedAlbum && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">유통 앨범</h2>
                  {albums.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 앨범이 없어요. "발매 신청" 탭에서 먼저 신청해주세요.</p>
                  ) : (
                    <div className="space-y-2">
                      {albums.map((album: any) => (
                        <button key={album.id} onClick={() => openAlbumDetail(album)} className="w-full flex gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-left">
                          {album.cover_image_url ? (
                            <img src={album.cover_image_url} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium dark:text-white truncate">{album.album_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {(album.distribution_album_artists ?? []).map((a: any) => a.distribution_artists?.name).filter(Boolean).join(', ')}
                            </p>
                            <p className="text-xs text-gray-400">{album.release_date ? new Date(album.release_date).toLocaleDateString('ko-KR') : ''} · {album.album_type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTab === 'albums' && selectedAlbum && (
                <div className="space-y-4">
                  <button onClick={() => setSelectedAlbum(null)} className="text-xs text-gray-500 dark:text-gray-400">← 앨범 목록으로</button>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <div className="flex gap-4">
                      {selectedAlbum.cover_image_url ? (
                        <img src={selectedAlbum.cover_image_url} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-lg font-bold dark:text-white">{selectedAlbum.album_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(selectedAlbum.distribution_album_artists ?? []).map((a: any) => a.distribution_artists?.name).filter(Boolean).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{selectedAlbum.genre}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div><span className="text-gray-400">발매일시</span><p className="dark:text-white">{selectedAlbum.release_date ? new Date(selectedAlbum.release_date).toLocaleDateString('ko-KR') : '-'}</p></div>
                      <div><span className="text-gray-400">앨범유형</span><p className="dark:text-white">{selectedAlbum.album_type}</p></div>
                      <div className="col-span-2"><span className="text-gray-400">UPC/EAN</span><p className="dark:text-white">{selectedAlbum.upc_ean || '-'}</p></div>
                    </div>
                    {selectedAlbum.album_intro && (
                      <div className="mt-3 pt-3 border-t dark:border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">앨범소개</p>
                        <p className="text-sm dark:text-gray-200 whitespace-pre-wrap">{selectedAlbum.album_intro}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h2 className="font-bold dark:text-white mb-3">Track List</h2>
                    {albumTracks.length === 0 ? (
                      <p className="text-xs text-gray-400">등록된 트랙이 없어요.</p>
                    ) : (
                      <div className="space-y-2">
                        {albumTracks.map((track: any) => (
                          <div key={track.id} className="border dark:border-gray-700 rounded-lg p-3">
                            <button onClick={() => setExpandedTrackId(expandedTrackId === track.id ? null : track.id)} className="w-full text-left">
                              <p className="text-xs text-gray-400">Disc.{track.disc_number} - Track.{track.track_number}</p>
                              <p className="text-sm font-medium dark:text-white">{track.track_name} <span className="text-xs text-gray-400">({track.version})</span></p>
                            </button>
                            {expandedTrackId === track.id && (
                              <div className="mt-2 pt-2 border-t dark:border-gray-700 space-y-2 text-xs">
                                {track.genre && <p><span className="text-gray-400">장르</span> · <span className="dark:text-gray-200">{track.genre}</span></p>}
                                {(track.distribution_track_credits ?? []).length > 0 && (
                                  <div>
                                    <p className="text-gray-400 mb-1">참여자</p>
                                    {track.distribution_track_credits.map((c: any) => (
                                      <p key={c.id} className="dark:text-gray-200">{c.role} - {c.name}</p>
                                    ))}
                                  </div>
                                )}
                                {track.lyrics && (
                                  <div>
                                    <p className="text-gray-400 mb-1">가사</p>
                                    <p className="dark:text-gray-200 whitespace-pre-wrap">{track.lyrics}</p>
                                  </div>
                                )}
                                {(track.isrc || track.uci) && (
                                  <p className="text-gray-400">{track.isrc && `ISRC: ${track.isrc}`} {track.uci && `· UCI: ${track.uci}`}</p>
                                )}
                                {(track.distribution_audio_files ?? []).length > 0 && (
                                  <div>
                                    <p className="text-gray-400 mb-1">오디오파일정보</p>
                                    {track.distribution_audio_files.map((a: any) => (
                                      <p key={a.id} className="dark:text-gray-200">{a.file_name} {a.duration && `(${a.duration})`}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {(selectedAlbum.distribution_store_links ?? []).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                      <h2 className="font-bold dark:text-white mb-3">Music Store 발매 링크</h2>
                      <div className="space-y-2">
                        {selectedAlbum.distribution_store_links.map((link: any) => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500">
                            {link.platform_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {subTab === 'artists' && !selectedArtist && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">아티스트</h2>
                  {artists.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 아티스트가 없어요.</p>
                  ) : (
                    <div className="space-y-2">
                      {artists.map((artist: any) => (
                        <button key={artist.id} onClick={() => setSelectedArtist(artist)} className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-left">
                          {artist.profile_image_url ? (
                            <img src={artist.profile_image_url} className="w-12 h-12 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium dark:text-white truncate">{artist.name}</p>
                            {artist.name_en && <p className="text-xs text-gray-400 truncate">{artist.name_en}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTab === 'artists' && selectedArtist && (
                <div className="space-y-4">
                  <button onClick={() => setSelectedArtist(null)} className="text-xs text-gray-500 dark:text-gray-400">← 아티스트 목록으로</button>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <div className="flex flex-col items-center text-center mb-3">
                      {selectedArtist.profile_image_url ? (
                        <img src={selectedArtist.profile_image_url} className="w-24 h-24 rounded-full object-cover mb-2" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 mb-2" />
                      )}
                      <p className="text-lg font-bold dark:text-white">{selectedArtist.name}</p>
                      {selectedArtist.name_en && <p className="text-sm text-gray-400">{selectedArtist.name_en}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-center border-t dark:border-gray-700 pt-3">
                      <div><p className="text-gray-400">국적</p><p className="dark:text-white mt-0.5">{selectedArtist.nationality || '-'}</p></div>
                      <div><p className="text-gray-400">유형</p><p className="dark:text-white mt-0.5">{selectedArtist.artist_type || '-'}</p></div>
                      <div><p className="text-gray-400">데뷔년도</p><p className="dark:text-white mt-0.5">{selectedArtist.debut_year || '-'}</p></div>
                    </div>
                    {selectedArtist.bio && (
                      <div className="mt-3 pt-3 border-t dark:border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">아티스트 소개</p>
                        <p className="text-sm dark:text-gray-200 whitespace-pre-wrap">{selectedArtist.bio}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h2 className="font-bold dark:text-white mb-2">발매 앨범</h2>
                    <p className="text-xs text-gray-400 mb-2">총 앨범수: {(selectedArtist.distribution_album_artists ?? []).length}</p>
                    {(selectedArtist.distribution_album_artists ?? []).map((rel: any) => (
                      <div key={rel.distribution_albums?.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium dark:text-white">{rel.distribution_albums?.album_name}</p>
                        <p className="text-xs text-gray-400">발매일: {rel.distribution_albums?.release_date ? new Date(rel.distribution_albums.release_date).toLocaleDateString('ko-KR') : '-'}</p>
                      </div>
                    ))}
                  </div>

                  {(selectedArtist.distribution_artist_links ?? []).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                      <h2 className="font-bold dark:text-white mb-3">URL</h2>
                      <div className="space-y-1">
                        {selectedArtist.distribution_artist_links.map((link: any) => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500">{link.platform_type}</a>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-center text-xs text-gray-400">아티스트 정보수정은 고객센터로 문의해주세요.</p>
                </div>
              )}

              {subTab === 'apply' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <button onClick={() => setShowApplyForm(!showApplyForm)} className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium">
                      {showApplyForm ? '취소' : '+ 새 발매 신청'}
                    </button>
                    {showApplyForm && (
                      <div className="space-y-3 mt-4">
                        <div>
                          <label className="text-xs font-medium dark:text-white">발매 희망일 *</label>
                          <input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => setDesiredTime('12:00')} className={`flex-1 py-1.5 text-xs rounded-lg ${desiredTime === '12:00' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500'}`}>12:00</button>
                            <button onClick={() => setDesiredTime('18:00')} className={`flex-1 py-1.5 text-xs rounded-lg ${desiredTime === '18:00' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500'}`}>18:00</button>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">신청 당일로부터 14일(2주)까지는 발매 희망일로 지정하실 수 없어요.</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">발매 자료 완성일 *</label>
                          <input type="date" value={materialDate} onChange={(e) => setMaterialDate(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">발매앨범명 *</label>
                          <input value={albumName} onChange={(e) => setAlbumName(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="발매 앨범명을 입력해주세요." />
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">참여 아티스트 *</label>
                          <input value={participatingArtists} onChange={(e) => setParticipatingArtists(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="아티스트A, (피처링)아티스트B" />
                          <p className="text-[10px] text-gray-400 mt-1">여러 명일 경우 콤마(,)로 구분, 피처링은 이름 앞에 (피처링) 표기</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">참여 아티스트의 스트리밍 사이트 URL</label>
                          <input value={artistStreamingUrl} onChange={(e) => setArtistStreamingUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="Melon/Vibe/Flo/Spotify 등 아티스트 페이지 링크" />
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">발매 앨범 관련 첨부파일 링크 *</label>
                          <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="Google Drive, Dropbox 등의 URL" />
                          <p className="text-[10px] text-gray-400 mt-1">음원(or 데모)를 첨부하지 않으실 경우 발매 검토 대상에서 제외돼요.</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">MV 포함 여부 *</label>
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => setHasMv('Y')} className={`flex-1 py-1.5 text-xs rounded-lg ${hasMv === 'Y' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500'}`}>Yes</button>
                            <button onClick={() => setHasMv('N')} className={`flex-1 py-1.5 text-xs rounded-lg ${hasMv === 'N' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500'}`}>No</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium dark:text-white">문의 및 요청사항</label>
                          <textarea value={inquiry} onChange={(e) => setInquiry(e.target.value)} rows={3} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="발매관련 문의사항 및 기타 요청사항이 있다면 입력해주세요." />
                        </div>
                        <button onClick={handleSubmitRequest} disabled={submitting} className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">신청하기</button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                    <h2 className="font-bold dark:text-white mb-3">신청 내역</h2>
                    {releaseRequests.length === 0 ? (
                      <p className="text-xs text-gray-400">신청 내역이 없어요.</p>
                    ) : (
                      <div className="space-y-2">
                        {releaseRequests.map((r: any) => (
                          <div key={r.id} className="border dark:border-gray-600 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium dark:text-white">{r.album_name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ml-2 ${r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {r.status === 'PENDING' ? '검토중' : r.status === 'APPROVED' ? '승인됨' : '거절됨'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">발매희망일: {r.release_desired_date} {r.release_desired_time}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {subTab === 'content' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">등록된 콘텐츠</h2>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 콘텐츠가 없어요.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(item => (
                        <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <PlatformIcon platform={platformIconKey(item.type, item.platform)} size={18} className="shrink-0" />
                          <div>
                            <p className="text-sm font-medium dark:text-white">{item.type === 'lyric_video' ? '리릭비디오' : platformLabel(item.platform)}</p>
                            {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400 mb-1">{item.artist_name} - {item.song_title}</p>}
                            <p className="text-xs text-blue-500 break-all">{item.url}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav tabs={[
        ...(hasProjects ? [
          { icon: <LayoutGrid size={20} />, label: '프로젝트', href: '/client' },
          { icon: <BarChart2 size={20} />, label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
          { icon: <FileText size={20} />, label: '신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
          { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, label: '보고서', onClick: () => { router.push('/client-report') } },
        ] : []),
        { icon: <Disc3 size={20} />, label: '유통', href: '/distribution', active: true },
        { icon: <User size={20} />, label: '마이페이지', href: '/client-mypage' },
      ]} />
    </>
  )
}
