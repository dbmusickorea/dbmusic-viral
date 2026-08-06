'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart2, MousePointer, DollarSign, RefreshCw } from 'lucide-react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'

interface Insights {
  spend: string
  impressions: string
  inline_link_clicks: string
  fetched_at: string
  cached?: boolean
}

function formatKRW(value: string) {
  const num = Math.round(parseFloat(value) || 0)
  return `₩${num.toLocaleString('ko-KR')}`
}

function formatNumber(value: string) {
  const num = parseInt(value) || 0
  return num.toLocaleString('ko-KR')
}

export default function MetaInsightsDashboard({ campaignId }: { campaignId?: string }) {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const url = campaignId ? `/api/meta-insights?campaign_id=${campaignId}` : '/api/meta-insights'
      const res = await fetchWithAuth(url)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message ?? '데이터 로드 실패')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  // Pull-to-Refresh
  useEffect(() => {
    let startY = 0
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0].clientY - startY
      if (diff > 80 && window.scrollY === 0) fetchInsights(true)
    }
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [fetchInsights])

  if (loading) return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
    </div>
  )

  if (error) return (
    <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg text-red-600 dark:text-red-300 text-sm">
      광고 데이터 없음
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white flex items-center gap-1">
          <BarChart2 size={16} /> 오늘의 광고 성과
        </h2>
        <button onClick={() => fetchInsights(true)} className="text-gray-400 dark:text-gray-500">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-3 text-center">
          <DollarSign size={14} className="text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">소진 금액</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {data ? formatKRW(data.spend) : '₩0'}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 rounded-xl p-3 text-center">
          <BarChart2 size={14} className="text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">노출수</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">
            {data ? formatNumber(data.impressions) : '0'}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 rounded-xl p-3 text-center">
          <MousePointer size={14} className="text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">클릭수</p>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
            {data ? formatNumber(data.inline_link_clicks) : '0'}
          </p>
        </div>
      </div>

      {data?.fetched_at && (
        <p className="text-xs text-gray-300 dark:text-gray-500 text-right mt-2">
          {data.cached ? '캐시 · ' : ''}{new Date(data.fetched_at).toLocaleTimeString('ko-KR')} 기준
        </p>
      )}
    </div>
  )
}
