'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function DistributionAdminPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [itemType, setItemType] = useState('lyric_video')
  const [itemPlatform, setItemPlatform] = useState('youtube')
  const [itemUrl, setItemUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [artistName, setArtistName] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchClients()
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
    const res = await fetchWithAuth(`/api/distribution-items?client_id=${client.id}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
  }

  const handleAddItem = async () => {
    if (!itemUrl.trim() || !selectedClient) return
    await fetchWithAuth('/api/distribution-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        type: itemType,
        platform: itemPlatform,
        url: itemUrl.trim(),
        song_title: songTitle.trim() || null,
        artist_name: artistName.trim() || null,
      })
    })
    setItemUrl('')
    openClient(selectedClient)
  }

  const handleDeleteItem = async (id: number) => {
    if (!confirm('삭제하시겠어요?')) return
    await fetchWithAuth(`/api/distribution-items?id=${id}`, { method: 'DELETE' })
    if (selectedClient) openClient(selectedClient)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-4">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/admin-mypage')} className="text-gray-600 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold dark:text-white">유통 서비스 관리</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-1/2 space-y-4">
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
          </div>

          <div className="w-full md:w-1/2 space-y-4">
            {!selectedClient ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <p className="text-xs text-gray-400">왼쪽에서 의뢰인을 선택해주세요.</p>
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">{selectedClient.name} - 링크 등록</h2>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="lyric_video">리릭비디오</option>
                        <option value="shorts">숏츠</option>
                      </select>
                      <select value={itemPlatform} onChange={(e) => setItemPlatform(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                        <option value="youtube">유튜브</option>
                        <option value="instagram">인스타그램</option>
                        <option value="tiktok">틱톡</option>
                      </select>
                    </div>
                    <input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="링크 URL" />
                    <input value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="아티스트명 (선택)" />
                    <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="곡명 (선택)" />
                    <button onClick={handleAddItem} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">등록</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                  <h2 className="font-bold dark:text-white mb-3">등록된 링크</h2>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400">등록된 링크가 없어요.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium dark:text-white">
                                {item.type === 'lyric_video' ? '리릭비디오' : '숏츠'} · {item.platform === 'youtube' ? '유튜브' : item.platform === 'instagram' ? '인스타' : '틱톡'}
                              </p>
                              {(item.artist_name || item.song_title) && <p className="text-xs text-gray-400">{item.artist_name} - {item.song_title}</p>}
                              <p className="text-xs text-blue-500 break-all mt-1">{item.url}</p>
                            </div>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-400">
                              <Trash2 size={16} />
                            </button>
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
      </div>
    </div>
  )
}
