'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page5() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [memberPosts, setMemberPosts] = useState<any[]>([])
  const [memo, setMemo] = useState('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    const { data } = await supabase.from('settlements').select('*').order('requested_at', { ascending: false })
    setSettlements(data ?? [])
  }

  const handleSelect = async (s: any) => {
    setSelected(s)
    setMemo(s.memo ?? '')
    const { data: participant } = await supabase.from('participants').select('*').eq('id', s.member_id).maybeSingle()
    setSelectedParticipant(participant)
    const { data: posts } = await supabase.from('posts').select('*').eq('member_id', s.member_id).order('created_at', { ascending: false })
    setMemberPosts(posts ?? [])
  }

  const handleApprove = async () => {
    if (!selected) return
    await supabase.from('settlements').update({ status: 'APPROVED', memo }).eq('id', selected.id)
    if (selectedParticipant) {
      await supabase.from('participants').update({
        balance: (selectedParticipant.balance ?? 0) - (selected.net_amount ?? selected.amount ?? 0)
      }).eq('id', selected.member_id)
    }
    alert('승인 완료!')
    fetchSettlements()
    setSelected(null)
    setSelectedParticipant(null)
    setMemberPosts([])
    setMemo('')
  }

  const handleReject = async () => {
    if (!selected) return
    await supabase.from('settlements').update({ status: 'REJECTED', memo }).eq('id', selected.id)
    alert('거절 완료!')
    fetchSettlements()
    setSelected(null)
    setSelectedParticipant(null)
    setMemberPosts([])
    setMemo('')
  }

  const handleSaveMemo = async () => {
    if (!selected) return
    await supabase.from('settlements').update({ memo }).eq('id', selected.id)
    alert('메모 저장 완료!')
    fetchSettlements()
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const statusLabel = (s: string) => {
    if (s === 'APPROVED') return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">승인</span>
    if (s === 'REJECTED') return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">거절</span>
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">💰 정산 관리</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/page1')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
            <button onClick={() => router.push('/page2')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/page3')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/page4')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">환전 신청 목록</h2>
          {settlements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">신청 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {settlements.map((s) => (
                <div key={s.id} onClick={() => handleSelect(s)} className={`border rounded-lg p-3 cursor-pointer ${selected?.id === s.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">회원 ID: {s.member_id}</p>
                      <p className="text-xs text-gray-500">{new Date(s.requested_at).toLocaleDateString('ko-KR')}</p>
                      {s.memo && <p className="text-xs text-blue-600 mt-1">📝 메모 있음</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{s.amount?.toLocaleString()}원</p>
                      {statusLabel(s.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">💰 환전 신청 상세</h2>
            <div className="space-y-2 text-sm">
              <p>체험단명: <span className="font-medium">{selectedParticipant?.name ?? '-'}</span></p>
              <p>현재 잔액: <span className="font-medium">{selectedParticipant?.balance?.toLocaleString() ?? 0}원</span></p>
              <p>신청 금액: <span className="font-medium">{selected.amount?.toLocaleString()}원</span></p>
              <p>원천징수: <span className="font-medium">{selected.tax_amount?.toLocaleString() ?? 0}원</span></p>
              <p>실수령액: <span className="font-medium">{selected.net_amount?.toLocaleString() ?? 0}원</span></p>
              <p>상태: {statusLabel(selected.status)}</p>
            </div>

            {/* 메모 */}
            <div className="mt-4">
              <label className="text-sm font-medium">📝 관리자 메모 (체험단에게 전달)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                rows={3}
                placeholder="승인/거절 사유 또는 전달 내용 입력"
              />
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
              {memberPosts.map((post) => (
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
          </div>
        )}
      </div>
    </div>
  )
}