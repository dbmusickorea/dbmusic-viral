'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { LogOut, PlayCircle } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'

export default function DistributionPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [hasProjects, setHasProjects] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    const stored = localStorage.getItem('userInfo')
    if (role !== 'client' || !stored) { router.push('/'); return }
    const parsed = JSON.parse(stored)
    if (!parsed.has_distribution) { router.push('/client'); return }
    setUserInfo(parsed)
    fetchData(parsed.id)
  }, [])

  const fetchData = async (clientId: number) => {
    setLoading(true)
    const [itemsRes, projectsRes] = await Promise.all([
      fetchWithAuth(`/api/distribution-items?client_id=${clientId}`),
      fetchWithAuth(`/api/projects?client_id=${clientId}`)
    ])
    const itemsData = await itemsRes.json()
    const projectsData = await projectsRes.json()
    setItems(Array.isArray(itemsData) ? itemsData : [])
    setHasProjects(Array.isArray(projectsData) && projectsData.length > 0)
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    localStorage.removeItem('autoLogin')
    router.push('/')
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  const lyricVideos = items.filter(i => i.type === 'lyric_video')
  const shorts = items.filter(i => i.type === 'shorts')

  const platformLabel = (p: string) => p === 'youtube' ? '유튜브' : p === 'instagram' ? '인스타그램' : '틱톡'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 dark:invert" />
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold dark:text-white">{userInfo?.name}님의 유통 서비스</h1>
          <button onClick={handleLogout} className="text-gray-400"><LogOut size={20} /></button>
        </div>

        {hasProjects && (
          <button onClick={() => router.push('/client')} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mb-4 flex items-center justify-center gap-2">
            <PlayCircle size={18} /> 바이럴 캠페인 현황 보기
          </button>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold dark:text-white mb-3 flex items-center gap-1.5"><PlatformIcon platform="youtube" size={18} /> 리릭비디오</h2>
          {lyricVideos.length === 0 ? (
            <p className="text-xs text-gray-400">등록된 리릭비디오가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {lyricVideos.map(item => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium dark:text-white">{platformLabel(item.platform)}</p>
                  {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400 mb-1">{item.artist_name} - {item.song_title}</p>}
                  <p className="text-xs text-blue-500 break-all">{item.url}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
          <h2 className="font-bold dark:text-white mb-3 flex items-center gap-1.5"><PlatformIcon platform="youtube_shorts" size={18} /> 숏츠</h2>
          {shorts.length === 0 ? (
            <p className="text-xs text-gray-400">등록된 숏츠가 없어요.</p>
          ) : (
            <div className="space-y-2">
              {shorts.map(item => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium dark:text-white">{platformLabel(item.platform)}</p>
                  {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400 mb-1">{item.artist_name} - {item.song_title}</p>}
                  <p className="text-xs text-blue-500 break-all">{item.url}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
