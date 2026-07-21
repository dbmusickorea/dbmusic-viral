'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { decryptText, maskResident } from '../lib/crypto'
import { RefreshCw, ArrowDown } from 'lucide-react'

export default function Page5() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [memberPosts, setMemberPosts] = useState<any[]>([])
  const [memo, setMemo] = useState('')
  const router = useRouter()
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [decryptedResident, setDecryptedResident] = useState('')
  const [decryptedAccount, setDecryptedAccount] = useState('')
  const [memberPostPage, setMemberPostPage] = useState(0)
  const PAGE_SIZE = 5

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    const res = await fetch('/api/settlements')
    const data = await res.json()
    setSettlements(data ?? [])
  }

  const handleSelect = async (s: any) => {
    setSelected(s)
    setMemo(s.memo ?? '')
    const participantRes = await fetch(`/api/participants?ids=${s.member_id}`)
    const participants = await participantRes.json()
    const participant = participants?.[0]
    setSelectedParticipant(participant)
    const postsRes = await fetch(`/api/posts?member_id=${s.member_id}`)
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
    await fetch(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', memo })
    })
    if (selectedParticipant) {
      await fetch(`/api/participants?id=${selected.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: (selectedParticipant.balance ?? 0) - (selected.net_amount ?? selected.amount ?? 0)
        })
      })
    }
    // 체험단에게 푸시 알림 발송
    const memberTokensRes = await fetch(`/api/push_tokens?user_id=${String(selected.member_id)}`)
    const memberTokens = await memberTokensRes.json()
    if (memberTokens && memberTokens.length > 0) {
      await fetch('/api/push', {
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
    alert('승인 완료!')
    fetchSettlements()
    setSelected(null); setSelectedParticipant(null); setMemberPosts([]); setMemo('')
  }

  const handleReject = async () => {
    if (!selected) return
    await fetch(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', memo })
    })
    // 체험단에게 푸시 알림 발송
    const memberTokensRes = await fetch(`/api/push_tokens?user_id=${String(selected.member_id)}`)
    const memberTokens = await memberTokensRes.json()
    if (memberTokens && memberTokens.length > 0) {
      await fetch('/api/push', {
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
    alert('거절 완료!')
    fetchSettlements()
    setSelected(null); setSelectedParticipant(null); setMemberPosts([]); setMemo('')
  }

  const handleSaveMemo = async () => {
    if (!selected) return
    await fetch(`/api/settlements?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo })
    })
    alert('메모 저장 완료!')
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
    <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          {(isPulling || isRefreshing) && (
            <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
              {isRefreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
              ) : (
                <><ArrowDown size={14} /> 놓으면 새로고침</>
              )}
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">정산 관리</h1>
            <button onClick={() => window.open('/api/settlement-excel', '_blank')} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg">📥 엑셀 다운로드</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
            <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/members')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
          </div>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 - 환전 신청 목록 */}
          <div>
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">환전 신청 목록</h2>
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
                    }} className={`border rounded-lg p-3 cursor-pointer ${selected?.id === s.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{s.participants?.name ?? `회원 ID: ${s.member_id}`}</p>
                          <p className="text-xs text-gray-500">{new Date(s.requested_at).toLocaleDateString('ko-KR')}</p>
                          {s.paid_at && <p className="text-xs text-blue-600">정산완료: {new Date(s.paid_at).toLocaleDateString('ko-KR')}</p>}
                          {s.memo && <p className="text-xs text-blue-600 mt-1">📝 메모 있음</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{s.amount?.toLocaleString()}P</p>
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
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">💰 환전 신청 상세</h2>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-base">{selectedParticipant?.name ?? '-'}</p>
                    {selectedParticipant?.referral_code && (
                      <p className="text-xs text-blue-600 mt-1">추천인 코드: {selectedParticipant.referral_code}</p>
                    )}
                  </div>
                  <p>현재 잔액: <span className="font-medium">{selectedParticipant?.balance?.toLocaleString() ?? 0}P</span></p>
                  <p>신청 금액: <span className="font-medium">{selected.amount?.toLocaleString()}P</span></p>
                  <p>원천징수: <span className="font-medium">{selected.tax_amount?.toLocaleString() ?? 0}P</span></p>
                  <p>실수령액: <span className="font-medium">{selected.net_amount?.toLocaleString() ?? 0}P</span></p>
                  <p>주민번호: <span className="font-medium">{decryptedResident || '-'}</span></p>
                  <p>계좌: <span className="font-medium">{selectedParticipant?.bank_name} {decryptedAccount} ({selectedParticipant?.account_holder})</span></p>
                  <p>상태: {statusLabel(selected.status)}</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">📝 관리자 메모 (체험단에게 전달)</label>
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="승인/거절 사유 또는 전달 내용 입력" />
                  <button onClick={handleSaveMemo} className="w-full border rounded-lg py-2 text-sm mt-1">메모 저장</button>
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
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-bold mb-3">📋 체험단 게시물 내역</h2>
                <div className="space-y-2">
                  {memberPosts.slice(memberPostPage * PAGE_SIZE, (memberPostPage + 1) * PAGE_SIZE).map((post) => (
                    <div key={post.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{post.project_code}</p>
                          <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">❤️ {post.likes_count?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">💬 {post.comments_count?.toLocaleString()}</p>
                        </div>
                      </div>
                      <a href={post.post_url} target="_blank" className="text-xs text-blue-500 mt-1 block truncate">링크 보기 →</a>
                    </div>
                  ))}
                </div>
                {memberPosts.length > PAGE_SIZE && (
                  <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setMemberPostPage(p => Math.max(0, p - 1))} disabled={memberPostPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                    <span className="text-xs text-gray-500">{memberPostPage + 1} / {Math.ceil(memberPosts.length / PAGE_SIZE)}</span>
                    <button onClick={() => setMemberPostPage(p => Math.min(Math.ceil(memberPosts.length / PAGE_SIZE) - 1, p + 1))} disabled={(memberPostPage + 1) * PAGE_SIZE >= memberPosts.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50"
      >
        ↑
      </button>
    </div>
  )
}