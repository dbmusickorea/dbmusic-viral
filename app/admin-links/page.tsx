'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import { Copy, Check, ArrowLeft, Trash2 } from 'lucide-react'

export default function AdminLinksPage() {
  const router = useRouter()
  const [sourceName, setSourceName] = useState('')
  const [label, setLabel] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const [stats, setStats] = useState<Record<string, { count: number, latest: string }>>({})
  const [metaAndroidInstalls, setMetaAndroidInstalls] = useState<string>('0')
  const [metaIosInstalls, setMetaIosInstalls] = useState<string>('0')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [linksRes, pRes, uRes] = await Promise.all([
      fetchWithAuth('/api/download-links'),
      fetchWithAuth('/api/participants'),
      fetchWithAuth('/api/users')
    ])
    const linksData = await linksRes.json()
    const pData = await pRes.json()
    const uData = await uRes.json()

    setLinks(Array.isArray(linksData) ? linksData : [])

    const all = [
      ...(Array.isArray(pData) ? pData : []),
      ...(Array.isArray(uData) ? uData.filter((u: any) => u.role === 'client') : [])
    ].filter((u: any) => u.download_source)

    const grouped: Record<string, { count: number, latest: string }> = {}
    for (const u of all) {
      const src = u.download_source
      if (!grouped[src]) grouped[src] = { count: 0, latest: u.created_at }
      grouped[src].count++
      if (u.created_at > grouped[src].latest) grouped[src].latest = u.created_at
    }
    setStats(grouped)
    setLoading(false)
    // Meta 앱 설치 수
    fetch('/api/meta-insights?campaign_id=120255973470720715').then(r => r.json()).then(d => { if (d.mobile_app_installs) setMetaAndroidInstalls(d.mobile_app_installs) })
    fetch('/api/meta-insights?campaign_id=120256259817260715').then(r => r.json()).then(d => { if (d.mobile_app_installs) setMetaIosInstalls(d.mobile_app_installs) })
  }

  const handleGenerate = async () => {
    if (!sourceName.trim()) return
    const res = await fetchWithAuth('/api/download-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_name: sourceName.trim(), label: label.trim() || null })
    })
    if (res.ok) {
      setSourceName('')
      setLabel('')
      fetchData()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠어요?')) return
    await fetchWithAuth(`/api/download-links?id=${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleCopy = (id: number, sourceName: string) => {
    const url = `https://app.doubleb.kr/download?src=${encodeURIComponent(sourceName)}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

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
          <h1 className="text-xl font-bold dark:text-white">유입 링크 관리</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* 왼쪽: 링크 생성 */}
          <div className="w-full md:w-1/2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="font-bold dark:text-white mb-3">링크 생성</h2>
              <div className="space-y-2">
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="소스명 (영문, 예: instagram_0810)"
                />
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="설명 (한글, 예: 인스타그램 8월 게시물)"
                />
                <button onClick={handleGenerate} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">생성</button>
              </div>
            </div>

            {/* 링크 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="font-bold dark:text-white mb-3">생성된 링크</h2>
              {links.length === 0 ? (
                <p className="text-xs text-gray-400">생성된 링크가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {links.map(link => (
                    <div key={link.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-sm font-medium dark:text-white">{link.label || link.source_name}</p>
                          <p className="text-xs text-gray-400">{link.source_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(link.id, link.source_name)} className="text-blue-600">
                            {copied === link.id ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                          <button onClick={() => handleDelete(link.id)} className="text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 break-all">{`https://app.doubleb.kr/download?src=${link.source_name}`}</p>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 통계 */}
          <div className="w-full md:w-1/2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="font-bold dark:text-white mb-3">유입 경로 통계</h2>
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">Meta 광고 앱 설치</p>
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Android</p>
                  <span className="text-xs font-bold text-green-600">{metaAndroidInstalls}건</span>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">iOS</p>
                  <span className="text-xs font-bold text-blue-600">{metaIosInstalls}건</span>
                </div>
              </div>
              {links.length === 0 ? (
                <p className="text-xs text-gray-400">아직 데이터가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {links.sort((a: any, b: any) => (b.click_count ?? 0) - (a.click_count ?? 0)).map((link: any) => {
                    const v = stats[link.source_name]
                    return (
                      <div key={link.source_name} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium dark:text-white">{link.label || link.source_name}</p>
                          <span className="text-sm font-bold text-blue-600">{v?.count ?? 0}명 가입</span>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <p className="text-xs text-gray-400">전체 클릭: {link.click_count ?? 0}</p>
                          <p className="text-xs text-blue-400">iOS: {link.ios_click_count ?? 0}</p>
                          <p className="text-xs text-green-500">Android: {link.android_click_count ?? 0}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
