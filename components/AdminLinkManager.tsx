'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { Copy, Check } from 'lucide-react'

export default function AdminLinkManager() {
  const [sourceName, setSourceName] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const pRes = await fetchWithAuth('/api/participants')
    const pData = await pRes.json()
    const uRes = await fetchWithAuth('/api/users')
    const uData = await uRes.json()

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

    setStats(Object.entries(grouped).map(([src, v]) => ({ src, ...v })).sort((a, b) => b.count - a.count))
  }

  const handleGenerate = () => {
    if (!sourceName.trim()) return
    const url = `https://app.doubleb.kr/download?src=${encodeURIComponent(sourceName.trim())}`
    setGeneratedUrl(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* 링크 생성 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h2 className="font-bold dark:text-white mb-3">유입 링크 생성</h2>
        <div className="flex gap-2 mb-3">
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            placeholder="소스명 (예: instagram, youtube_0810)"
          />
          <button onClick={handleGenerate} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">생성</button>
        </div>
        {generatedUrl && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 flex-1 break-all">{generatedUrl}</p>
            <button onClick={handleCopy} className="shrink-0 text-blue-600">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h2 className="font-bold dark:text-white mb-3">유입 경로 통계</h2>
        {stats.length === 0 ? (
          <p className="text-xs text-gray-400">데이터가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {stats.map(s => (
              <div key={s.src} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium dark:text-white">{s.src}</p>
                  <p className="text-xs text-gray-400">{new Date(s.latest).toLocaleDateString('ko-KR')} 최근 가입</p>
                </div>
                <span className="text-sm font-bold text-blue-600">{s.count}명</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
