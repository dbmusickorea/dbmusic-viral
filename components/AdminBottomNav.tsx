'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutGrid, Building2, Users, Wallet, Music, UserCircle } from 'lucide-react'

type AdminBottomNavProps = {
  active?: 'admin' | 'client' | 'members' | 'settlement' | 'cover' | 'mypage'
  onClientClick?: () => void
}

export default function AdminBottomNav({ active, onClientClick }: AdminBottomNavProps) {
  const router = useRouter()
  const [snsRequestCount, setSnsRequestCount] = useState(0)
  const [coverPendingCount, setCoverPendingCount] = useState(0)
  const [settlementCount, setSettlementCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      const [snsRes, coverRes, settleRes] = await Promise.all([
        fetch('/api/sns_change_requests?status=PENDING'),
        fetch('/api/posts?is_cover=true&cover_status=PENDING'),
        fetch('/api/settlements?status=PENDING')
      ])
      const snsData = await snsRes.json()
      const coverData = await coverRes.json()
      const settleData = await settleRes.json()
      setSnsRequestCount(Array.isArray(snsData) ? snsData.length : 0)
      setCoverPendingCount(Array.isArray(coverData) ? coverData.length : 0)
      setSettlementCount(Array.isArray(settleData) ? settleData.length : 0)
    }
    fetchCounts()
  }, [])

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <button onClick={() => router.push('/admin')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'admin' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutGrid size={20} className="mb-0.5" />프로젝트
        </button>
        <button onClick={() => onClientClick ? onClientClick() : router.push('/client')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'client' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Building2 size={20} className="mb-0.5" />의뢰인
        </button>
        <button onClick={() => router.push('/members')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'members' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className="relative">
            <Users size={20} className="mb-0.5" />
            {snsRequestCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{snsRequestCount}</span>}
          </div>회원관리
        </button>
        <button onClick={() => router.push('/settlement')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'settlement' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className="relative">
            <Wallet size={20} className="mb-0.5" />
            {settlementCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{settlementCount}</span>}
          </div>정산
        </button>
        <button onClick={() => router.push('/cover')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'cover' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className="relative">
            <Music size={20} className="mb-0.5" />
            {coverPendingCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{coverPendingCount}</span>}
          </div>커버
        </button>
        <button onClick={() => router.push('/admin-mypage')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'mypage' ? 'text-blue-600' : 'text-gray-400'}`}>
          <UserCircle size={20} className="mb-0.5" />마이페이지
        </button>
      </div>
      <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
    </>
  )
}
