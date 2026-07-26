'use client'

import { useRouter } from 'next/navigation'

type AdminBottomNavProps = {
  active?: 'admin' | 'client' | 'members' | 'settlement' | 'cover' | 'mypage'
  onClientClick?: () => void
}

export default function AdminBottomNav({ active, onClientClick }: AdminBottomNavProps) {
  const router = useRouter()

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <button onClick={() => router.push('/admin')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'admin' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">📋</span>프로젝트
        </button>
        <button onClick={() => onClientClick ? onClientClick() : router.push('/client')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'client' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">🏢</span>의뢰인
        </button>
        <button onClick={() => router.push('/members')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'members' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">👤</span>회원관리
        </button>
        <button onClick={() => router.push('/settlement')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'settlement' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">💰</span>정산
        </button>
        <button onClick={() => router.push('/admin-mypage')} className={`flex-1 flex flex-col items-center py-3 text-xs ${active === 'mypage' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-lg mb-0.5">👤</span>마이페이지
        </button>
      </div>
      <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
    </>
  )
}
