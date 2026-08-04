'use client'
import { fetchWithAuth } from '../lib/fetchWithAuth'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { decryptText, maskResident } from '../lib/crypto'
import { RefreshCw, ArrowDown, Coins, FileText, ClipboardList, MessageCircle, StickyNote } from 'lucide-react'
import { useToast } from '../../components/ToastContext'
import AdminBottomNav from '../../components/AdminBottomNav'
import Sidebar from '../../components/Sidebar'

export default function Page5() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [memberPosts, setMemberPosts] = useState<any[]>([])
  const [memo, setMemo] = useState('')
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [decryptedResident, setDecryptedResident] = useState('')
  const [decryptedAccount, setDecryptedAccount] = useState('')
  const [memberPostPage, setMemberPostPage] = useState(0)
  const { showToast } = useToast()
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const PAGE_SIZE = 5

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchSettlements()
    
    const loadTotals = async () => {
      const res = await fetchWithAuth('/api/settlement-summary')
      const data = await res.json()
      setTotalBalance(data.totalBalance ?? 0)
      setTotalAvailable(data.totalAvailable ?? 0)
    }
    loadTotals()
  }, [])

  const fetchSettlements = async () => {
    const res = await fetchWithAuth('/api/settlements')
    const data = await res.json()
    setSettlements(data ?? [])
  }

  const handleSelect = async (s: any) => {
    setSelected(s)
    setMemo(s.memo ?? '')
    const participantRes = await fetchWithAuth(`/api/participants?ids=${s.member_id}`)
    const participants = await participantRes.json()
    const participant = participants?.[0]
    setSelectedParticipant(participant)
    const postsRes = await fetchWithAuth(`/api/posts?member_id=${s.member_id}`)
    const posts = await postsRes.json()
    setMemberPosts(posts ?? [])
    const account = participant?.account_number ? await decryptText(participant.account_number) : ''
    setDecryptedAccount(account)
    
    // 주민번호 복호화
    const resident = s.resident_number ? await decryptText(s.resident_number) : ''
    setDecryptedResident(resident)
  }

  const handleApprove = async () => {
    if (!selected) return
    await fetchWithAuth(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', memo })
    })
    if (selectedParticipant) {
      await fetchWithAuth(`/api/participants?id=${selected.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: (selectedParticipant.balance ?? 0) - (selected.net_amount ?? selected.amount ?? 0)
        })
      })
    }
    // 체험단에게 푸시 알림 발송
    const memberTokensRes = await fetchWithAuth(`/api/push_tokens?user_id=${String(selected.member_id)}`)
    const memberTokens = await memberTokensRes.json()
    if (memberTokens && memberTokens.length > 0) {
      await fetchWithAuth('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '💰 환전 신청이 승인됐어요!',
          body: `${(selected.net_amount ?? selected.amount ?? 0).toLocaleString()}P 환전이 승인됐어요.`,
          tokens: memberTokens.map((t: any) => t.token),
          userIds: [String(selected.member_id)]
        })
      })
    }
    showToast('승인 완료!')
    fetchSettlements()
    setSelected(null); setSelectedParticipant(null); setMemberPosts([]); setMemo('')
  }

  const handleReject = async () => {
    if (!selected) return
    await fetchWithAuth(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', memo })
    })
    // 체험단에게 푸시 알림 발송
    const memberTokensRes = await fetchWithAuth(`/api/push_tokens?user_id=${String(selected.member_id)}`)
    const memberTokens = await memberTokensRes.json()
    if (memberTokens && memberTokens.length > 0) {
      await fetchWithAuth('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '❌ 환전 신청이 거절됐어요.',
          body: `환전 신청이 거절됐어요. 사유: ${memo || '없음'}`,
          tokens: memberTokens.map((t: any) => t.token),
          userIds: [String(selected.member_id)]
        })
      })
    }
    showToast('거절 완료!')
    fetchSettlements()
    setSelected(null); setSelectedParticipant(null); setMemberPosts([]); setMemo('')
  }

  const handleSaveMemo = async () => {
    if (!selected) return
    await fetchWithAuth(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo })
    })
    showToast('메모 저장 완료!')
    fetchSettlements()
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await fetchSettlements()
    setIsRefreshing(false)
  }

  const statusLabel = (s: string) => {
    if (s === 'PAID') return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">정산완료</span>
    if (s === 'APPROVED') return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">승인</span>
    if (s === 'REJECTED') return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">거절</span>
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기</span>
  }

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/admin') },
          { icon: '🏢', label: '의뢰인', onClick: () => router.push('/client') },
          { icon: '👤', label: '회원관리', onClick: () => router.push('/members') },
          { icon: '💰', label: '정산', onClick: () => router.push('/settlement'), active: true },
          { icon: '🎵', label: '커버', onClick: () => router.push('/cover') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/admin-mypage') },
        ]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        } else {
          setPullStartY(0)
        }
      }}
      onTouchMove={(e) => {
        if (pullStartY === 0) return
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
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
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold dark:text-white">정산 관리</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                const url = 'https://app.doubleb.kr/api/settlement-excel'
                if ((window as any).Capacitor?.isNativePlatform?.()) {
                  const { Browser } = await import('@capacitor/browser')
                  await Browser.open({ url })
                } else {
                  window.open(url, '_blank')
                }
              }} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white"><path d="M21.17 3.25H13.5V1.67A.67.67 0 0 0 12.83 1H2.67A.67.67 0 0 0 2 1.67v20.66c0 .37.3.67.67.67h10.16a.67.67 0 0 0 .67-.67v-1.58h7.67c.46 0 .83-.37.83-.83V4.08c0-.46-.37-.83-.83-.83zM13.5 20.33v-1.08H21v1.08H13.5zm7.5-2.41H13.5V5.08H21v12.84zM5.5 15.17l2.17-3.33-2-3.09h1.75l1.08 1.92 1.08-1.92h1.75l-2 3.09 2.17 3.33h-1.83l-1.17-2.08-1.17 2.08H5.5z"/></svg>
                환전 엑셀
              </button>
              <button onClick={async () => {
                const url = 'https://app.doubleb.kr/api/point-history-excel'
                if ((window as any).Capacitor?.isNativePlatform?.()) {
                  const { Browser } = await import('@capacitor/browser')
                  await Browser.open({ url })
                } else {
                  window.open(url, '_blank')
                }
              }} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white"><path d="M21.17 3.25H13.5V1.67A.67.67 0 0 0 12.83 1H2.67A.67.67 0 0 0 2 1.67v20.66c0 .37.3.67.67.67h10.16a.67.67 0 0 0 .67-.67v-1.58h7.67c.46 0 .83-.37.83-.83V4.08c0-.46-.37-.83-.83-.83zM13.5 20.33v-1.08H21v1.08H13.5zm7.5-2.41H13.5V5.08H21v12.84zM5.5 15.17l2.17-3.33-2-3.09h1.75l1.08 1.92 1.08-1.92h1.75l-2 3.09 2.17 3.33h-1.83l-1.17-2.08-1.17 2.08H5.5z"/></svg>
                적립금 내역
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">체험단 총 적립금</p>
            <p className="text-xl font-bold text-blue-600">{totalBalance.toLocaleString()}P</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">환전 가능 금액</p>
            <p className="text-xl font-bold text-green-600">{totalAvailable.toLocaleString()}P</p>
          </div>
        </div>
        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 - 환전 신청 목록 */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3 dark:text-white">환전 신청 목록</h2>
              {settlements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">신청 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {settlements.map((s) => (
                    <div key={s.id} onClick={() => {
                      if (selected?.id === s.id) {
                        setSelected(null)
                        setSelectedParticipant(null)
                        setMemberPosts([])
                      } else {
                        handleSelect(s)
                      }
                    }} className={`border dark:border-gray-600 rounded-lg p-3 cursor-pointer ${selected?.id === s.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-700'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm dark:text-white">{s.participants?.name ?? `회원 ID: ${s.member_id}`}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(s.requested_at).toLocaleDateString('ko-KR')}</p>
                          {s.paid_at && <p className="text-xs text-blue-600">정산완료: {new Date(s.paid_at).toLocaleDateString('ko-KR')}</p>}
                          {s.memo && <p className="text-xs text-blue-600 mt-1 flex items-center gap-0.5"><StickyNote size={10} /> 메모 있음</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium dark:text-white">{s.amount?.toLocaleString()}P</p>
                          {statusLabel(s.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 - 상세 정보 */}
          <div>
            {selected && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Coins size={16} /> 환전 신청 상세</h2>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="font-medium text-base dark:text-white">{selectedParticipant?.name ?? '-'}</p>
                    {selectedParticipant?.referral_code && (
                      <p className="text-xs text-blue-600 mt-1">추천인 코드: {selectedParticipant.referral_code}</p>
                    )}
                  </div>
                  <p className="dark:text-gray-300">현재 잔액: <span className="font-medium">{selectedParticipant?.balance?.toLocaleString() ?? 0}P</span></p>
                  <p className="dark:text-gray-300">신청 금액: <span className="font-medium">{selected.amount?.toLocaleString()}P</span></p>
                  <p className="dark:text-gray-300">원천징수: <span className="font-medium">{selected.tax_amount?.toLocaleString() ?? 0}P</span></p>
                  <p className="dark:text-gray-300">실수령액: <span className="font-medium">{selected.net_amount?.toLocaleString() ?? 0}P</span></p>
                  <p className="dark:text-gray-300">주민번호: <span className="font-medium">{decryptedResident || '-'}</span></p>
                  <p className="dark:text-gray-300">계좌: <span className="font-medium">{selectedParticipant?.bank_name} {decryptedAccount} ({selectedParticipant?.account_holder})</span></p>
                  <p className="dark:text-gray-300">상태: {statusLabel(selected.status)}</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium dark:text-white flex items-center gap-1"><FileText size={14} /> 관리자 메모 (체험단에게 전달)</label>
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" rows={3} placeholder="승인/거절 사유 또는 전달 내용 입력" />
                  <button onClick={handleSaveMemo} className="w-full border dark:border-gray-600 dark:text-gray-300 rounded-lg py-2 text-sm mt-1">메모 저장</button>
                </div>
                {selected.status === 'PENDING' && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleApprove} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">승인</button>
                    <button onClick={handleReject} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">거절</button>
                  </div>
                )}
              </div>
            )}

            {memberPosts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
                <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><ClipboardList size={16} /> 체험단 게시물 내역</h2>
                <div className="space-y-2">
                  {memberPosts.slice(memberPostPage * PAGE_SIZE, (memberPostPage + 1) * PAGE_SIZE).map((post) => (
                    <div key={post.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium dark:text-white">{post.project_code}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm dark:text-white">❤️ {post.likes_count?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5"><MessageCircle size={10} /> {post.comments_count?.toLocaleString()}</p>
                        </div>
                      </div>
                      <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">링크 보기 →</a>
                    </div>
                  ))}
                </div>
                {memberPosts.length > PAGE_SIZE && (
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setMemberPostPage(p => Math.max(0, p - 1))} disabled={memberPostPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{memberPostPage + 1} / {Math.ceil(memberPosts.length / PAGE_SIZE)}</span>
                    <button onClick={() => setMemberPostPage(p => Math.min(Math.ceil(memberPosts.length / PAGE_SIZE) - 1, p + 1))} disabled={(memberPostPage + 1) * PAGE_SIZE >= memberPosts.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-4 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      <AdminBottomNav active="settlement" />
    </div>
    </>
  )
}