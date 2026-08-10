'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'

interface Insights {
  spend: string
  lifetime_spend: string
  impressions: string
  inline_link_clicks: string
  daily_budget: string
  lifetime_budget: string
  budget_remaining: string
  ctr: string
  start_time: string
  stop_time: string
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
      const url = campaignId ? `/api/meta-insights?campaign_id=${campaignId}${isRefresh ? '&refresh=1' : ''}` : `/api/meta-insights${isRefresh ? '?refresh=1' : ''}`
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

  if (error) return null

  const budget = data?.daily_budget !== '0' ? data?.daily_budget : data?.lifetime_budget

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white flex items-center gap-1">
          <svg className="w-4 h-4" fill="#0866FF" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M5,19.5c0-4.6,2.3-9.4,5-9.4c1.5,0,2.7,0.9,4.6,3.6c-1.8,2.8-2.9,4.5-2.9,4.5c-2.4,3.8-3.2,4.6-4.5,4.6 C5.9,22.9,5,21.7,5,19.5 M20.7,17.8L19,15c-0.4-0.7-0.9-1.4-1.3-2c1.5-2.3,2.7-3.5,4.2-3.5c3,0,5.4,4.5,5.4,10.1 c0,2.1-0.7,3.3-2.1,3.3S23.3,22,20.7,17.8 M16.4,11c-2.2-2.9-4.1-4-6.3-4C5.5,7,2,13.1,2,19.5c0,4,1.9,6.5,5.1,6.5 c2.3,0,3.9-1.1,6.9-6.3c0,0,1.2-2.2,2.1-3.7c0.3,0.5,0.6,1,0.9,1.6l1.4,2.4c2.7,4.6,4.2,6.1,6.9,6.1c3.1,0,4.8-2.6,4.8-6.7 C30,12.6,26.4,7,22.1,7C19.8,7,18,8.8,16.4,11"/></svg>
          메타 광고 성과
        </h2>
        <button onClick={() => fetchInsights(true)} className="text-gray-400 dark:text-gray-500">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 1행: 총예산 / 소진 / 남은예산 */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-orange-50 dark:bg-orange-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">총 예산</p>
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{data ? formatKRW(budget ?? '0') : '₩0'}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">소진</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{data ? formatKRW(data.lifetime_spend) : '₩0'}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">남은 예산</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{data ? formatKRW(data.budget_remaining) : '₩0'}</p>
        </div>
      </div>

      {/* 2행: 노출수 / 클릭수 / CTR */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-purple-50 dark:bg-purple-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">노출수</p>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{data ? formatNumber(data.impressions) : '0'}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">클릭수</p>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{data ? formatNumber(data.inline_link_clicks) : '0'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">CTR</p>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{data ? `${data.ctr}%` : '0%'}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-gray-300 dark:text-gray-500">
          {data?.start_time ? `${new Date(data.start_time).toLocaleDateString('ko-KR')} ~ ${data.stop_time ? new Date(data.stop_time).toLocaleDateString('ko-KR') : '진행중'}` : ''}
        </p>
        {data?.fetched_at && (
          <p className="text-xs text-gray-300 dark:text-gray-500">
            {new Date(data.fetched_at).toLocaleTimeString('ko-KR')} 기준
          </p>
        )}
      </div>
    </div>
  )
}
