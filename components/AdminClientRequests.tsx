'use client'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { ClipboardList, MessageCircle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  clientRequests: any[]
  PAGE_SIZE: number
  projectCode: string
  onConfirm: (reqId: number) => void
  onCoverApprove: (req: any) => void
  onRefresh: () => void
  showToast: (msg: string) => void
}

export default function AdminClientRequests({ clientRequests, PAGE_SIZE, projectCode, onConfirm, onCoverApprove, onRefresh, showToast }: Props) {
  const [requestFilter, setRequestFilter] = useState('all')
  const [requestPage, setRequestPage] = useState(0)
  const [replyText, setReplyText] = useState<{[key: number]: string}>({})
  const [expandedReply, setExpandedReply] = useState<{[key: number]: boolean}>({})

  const filtered = clientRequests.filter(r => requestFilter === 'all' || r.user_type === requestFilter || (!r.user_type && requestFilter === 'client'))

  const handleReply = async (req: any) => {
    if (!replyText[req.id]) return
    await fetchWithAuth(`/api/client_requests?id=${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replyText[req.id], replied_at: new Date().toISOString() })
    })
    const clientRes = await fetchWithAuth(`/api/users?client_id=${req.client_id}`)
    const clientData = await clientRes.json()
    const clientUser = clientData?.[0]
    if (clientUser) {
      const tokensRes = await fetch(`/api/push_tokens?user_id=${String(clientUser.id)}`)
      const tokens = await tokensRes.json()
      if (tokens && tokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '📬 문의 답장이 왔어요!', data: { url: '/mypage' },
            body: replyText[req.id],
            tokens: tokens.map((t: any) => t.token),
            userIds: tokens.map((t: any) => t.user_id)
          })
        })
      }
    }
    if (req.member_id) {
      const memberTokensRes = await fetch(`/api/push_tokens?user_id=${String(req.member_id)}`)
      const memberTokens = await memberTokensRes.json()
      if (memberTokens && memberTokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '📬 문의 답장이 왔어요!', data: { url: '/mypage' },
            body: replyText[req.id],
            tokens: memberTokens.map((t: any) => t.token),
            userIds: memberTokens.map((t: any) => t.user_id)
          })
        })
      }

    }
    setReplyText(prev => ({...prev, [req.id]: ''}))
    onRefresh()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white flex items-center gap-1"><ClipboardList size={16} /> 문의 내역</h2>
        <div className="flex gap-2 text-xs">
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">검토중 {clientRequests.filter(r => r.status === 'PENDING').length}</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">확인됨 {clientRequests.filter(r => r.status === 'CONFIRMED').length}</span>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={() => setRequestFilter('all')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${requestFilter === 'all' ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>전체</button>
        <button onClick={() => setRequestFilter('client')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${requestFilter === 'client' ? 'bg-purple-600 text-white' : 'border text-gray-500'}`}>의뢰인</button>
        <button onClick={() => setRequestFilter('participant')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${requestFilter === 'participant' ? 'bg-green-600 text-white' : 'border text-gray-500'}`}>체험단</button>
      </div>
      {clientRequests.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">문의 내역이 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {filtered.slice(requestPage * PAGE_SIZE, (requestPage + 1) * PAGE_SIZE).map((req) => (
              <div key={req.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{req.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{req.client_name} · {req.client_mobile} · {new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{req.content}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${req.user_type === 'participant' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {req.user_type === 'participant' ? '체험단' : '의뢰인'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 ml-2">
                    <span className={`text-xs px-2 py-1 rounded-full text-center ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status === 'PENDING' ? '검토중' : req.status === 'CONFIRMED' ? '확인됨' : req.status === 'APPROVED' ? '승인' : '거절'}
                    </span>
                    {req.status === 'PENDING' && (
                      <>
                        <button onClick={() => onConfirm(req.id)} className="text-xs bg-blue-500 text-white rounded px-2 py-1">확인</button>
                        {req.title === '커버 체험단 추가 요청' && (
                          <button onClick={() => onCoverApprove(req)} className="text-xs bg-purple-500 text-white rounded px-2 py-1">커버승인</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {req.reply && (
                  <div className="mt-1">
                    <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                      <MessageCircle size={12} className="inline mr-1" />{expandedReply[req.id] ? req.reply : req.reply.slice(0, 30) + (req.reply.length > 30 ? '...' : '')}
                      {req.reply.length > 30 && (
                        <button onClick={() => setExpandedReply(prev => ({...prev, [req.id]: !prev[req.id]}))} className="ml-1 text-blue-400 underline">
                          {expandedReply[req.id] ? '접기' : '더보기'}
                        </button>
                      )}
                    </p>
                  </div>
                )}
                <div className="flex gap-1 mt-2">
                  <input
                    value={replyText[req.id] ?? ''}
                    onChange={(e) => setReplyText(prev => ({...prev, [req.id]: e.target.value}))}
                    className="flex-1 text-xs border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                    placeholder="답장 입력..."
                  />
                  <button onClick={() => handleReply(req)} className="text-xs bg-blue-600 text-white rounded px-2 py-1">답장</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <button onClick={() => setRequestPage(p => Math.max(0, p - 1))} disabled={requestPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
            <div className="flex gap-1">
              {Array.from({length: Math.ceil(filtered.length / PAGE_SIZE)}, (_, i) => (
                <button key={i} onClick={() => setRequestPage(i)} className={`text-xs px-2 py-1 border dark:border-gray-600 rounded ${requestPage === i ? 'bg-blue-600 text-white border-blue-600' : 'dark:text-gray-300'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setRequestPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE) - 1, p + 1))} disabled={(requestPage + 1) * PAGE_SIZE >= filtered.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
          </div>
        </>
      )}
    </div>
  )
}
