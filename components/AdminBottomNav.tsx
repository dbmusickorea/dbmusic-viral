'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { LayoutGrid, Building2, Users, Wallet, Music, UserCircle, Briefcase } from 'lucide-react'

type AdminBottomNavProps = {
  active?: 'admin' | 'client' | 'members' | 'settlement' | 'cover' | 'agency' | 'mypage'
  onClientClick?: () => void
}

export default function AdminBottomNav({ active, onClientClick }: AdminBottomNavProps) {
  const router = useRouter()
  const [snsRequestCount, setSnsRequestCount] = useState(0)
  const [coverPendingCount, setCoverPendingCount] = useState(0)
  const [settlementCount, setSettlementCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCounts = async () => {
      const [snsRes, coverRes, settleRes, coverApprovalRes] = await Promise.all([
        fetch('/api/sns_change_requests?status=PENDING'),
        fetch('/api/posts?is_cover=true&cover_status=PENDING'),
        fetch('/api/settlements?status=PENDING'),
        fetch('/api/participants?cover_approved=false')
      ])
      const snsData = await snsRes.json()
      const coverData = await coverRes.json()
      const settleData = await settleRes.json()
      const coverApprovalData = await coverApprovalRes.json()
      setSnsRequestCount((Array.isArray(snsData) ? snsData.length : 0) + (Array.isArray(coverApprovalData) ? coverApprovalData.length : 0))
      setCoverPendingCount(Array.isArray(coverData) ? coverData.length : 0)
      setSettlementCount(Array.isArray(settleData) ? settleData.length : 0)
    }
    fetchCounts()
  }, [])

  // 활성 탭으로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current && active) {
      const activeEl = scrollRef.current.querySelector(`[data-tab="${active}"]`) as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [active])

  const tabs = [
    { id: 'admin', label: '프로젝트', icon: <LayoutGrid size={20} className="mb-0.5" />, onClick: () => router.push('/admin') },
    { id: 'client', label: '의뢰인', icon: <Building2 size={20} className="mb-0.5" />, onClick: () => onClientClick ? onClientClick() : router.push('/client') },
    { id: 'members', label: '회원관리', icon: <Users size={20} className="mb-0.5" />, onClick: () => router.push('/members'), badge: snsRequestCount },
    { id: 'settlement', label: '정산', icon: <Wallet size={20} className="mb-0.5" />, onClick: () => router.push('/settlement'), badge: settlementCount },
    { id: 'cover', label: '커버', icon: <Music size={20} className="mb-0.5" />, onClick: () => router.push('/cover'), badge: coverPendingCount },
    { id: 'agency', label: '에이전시', icon: <Briefcase size={20} className="mb-0.5" />, onClick: () => router.push('/agency') },
    { id: 'mypage', label: '마이페이지', icon: <UserCircle size={20} className="mb-0.5" />, onClick: () => router.push('/admin-mypage') },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={tab.onClick}
              className={`flex-none flex flex-col items-center py-3 px-4 text-xs min-w-[72px] ${active === tab.id ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 ? <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{tab.badge}</span> : null}
              </div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
    </>
  )
}
