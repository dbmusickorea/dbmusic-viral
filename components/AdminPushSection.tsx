'use client'
import { Bell, Megaphone } from 'lucide-react'
import { useState } from 'react'

type Props = {
  pushTarget: string
  setPushTarget: (t: 'all' | 'participant' | 'client') => void
  pushTitle: string
  setPushTitle: (t: string) => void
  pushBody: string
  setPushBody: (t: string) => void
  isSendingPush: boolean
  setIsSendingPush: (v: boolean) => void
  onSendPush: () => void
  showToast: (msg: string) => void
}

export default function AdminPushSection({ pushTarget, setPushTarget, pushTitle, setPushTitle, pushBody, setPushBody, isSendingPush, setIsSendingPush, onSendPush, showToast }: Props) {
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Bell size={16} /> 푸시 알림 발송</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium dark:text-white">발송 대상</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setPushTarget('all')} className={`flex-1 text-xs py-2 rounded-lg border dark:border-gray-600 ${pushTarget === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'dark:text-gray-300'}`}>전체</button>
              <button onClick={() => setPushTarget('participant')} className={`flex-1 text-xs py-2 rounded-lg border dark:border-gray-600 ${pushTarget === 'participant' ? 'bg-blue-600 text-white border-blue-600' : 'dark:text-gray-300'}`}>체험단</button>
              <button onClick={() => setPushTarget('client')} className={`flex-1 text-xs py-2 rounded-lg border dark:border-gray-600 ${pushTarget === 'client' ? 'bg-green-600 text-white border-green-600' : 'dark:text-gray-300'}`}>의뢰인</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">제목</label>
            <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="알림 제목" />
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">내용</label>
            <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" rows={3} placeholder="알림 내용" />
          </div>
          <button onClick={onSendPush} disabled={isSendingPush} className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400 cursor-pointer">
            {isSendingPush ? '발송 중...' : `${pushTarget === 'all' ? '전체' : pushTarget === 'participant' ? '체험단' : '의뢰인'} 발송`}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
        <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><Megaphone size={16} /> 활동 요청 푸시</h2>
        <div className="space-y-3">
          <button onClick={async () => {
            setIsSendingPush(true)
            const allRes = await fetch('/api/participants')
            const allParticipants = await allRes.json()
            const joinedRes = await fetch('/api/project_participants')
            const joinedIds = await joinedRes.json()
            const joinedSet = new Set(joinedIds?.map((j: any) => j.member_id))
            const notJoined = allParticipants?.filter((p: any) => !joinedSet.has(p.id)) ?? []
            if (notJoined.length === 0) { showToast('미참여자가 없어요.'); setIsSendingPush(false); return }
            const tokensRes = await fetch(`/api/push_tokens?user_ids=${notJoined.map((p: any) => String(p.id)).join(',')}`)
            const tokens = await tokensRes.json()
            if (!tokens || tokens.length === 0) { showToast('발송할 토큰이 없어요.'); setIsSendingPush(false); return }
            await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '🎵 아직 프로젝트에 참여하지 않으셨나요?', body: '지금 바로 참여하고 리워드를 받아보세요!', tokens: tokens.map((t: any) => t.token), userIds: notJoined.map((p: any) => String(p.id)) }) })
            showToast(`✅ 미참여자 ${notJoined.length}명에게 발송됐어요!`)
            setIsSendingPush(false)
          }} disabled={isSendingPush} className="w-full bg-blue-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400 cursor-pointer">
            {isSendingPush ? '발송 중...' : '미참여자에게 발송'}
          </button>
          <button onClick={async () => {
            setIsSendingPush(true)
            const allRes = await fetch('/api/participants')
            const allParticipants = await allRes.json()
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
            const inactive: number[] = []
            for (const p of allParticipants ?? []) {
              const postsRes = await fetch(`/api/posts?member_id=${p.id}`)
              const posts = await postsRes.json()
              const recentPost = posts?.find((post: any) => new Date(post.created_at) >= oneMonthAgo)
              const joinRes = await fetch(`/api/project_participants?member_id=${p.id}&status=ACTIVE`)
              const joins = await joinRes.json()
              if (!recentPost && joins.length === 0) inactive.push(p.id)
            }
            if (inactive.length === 0) { showToast('미활동자가 없어요.'); setIsSendingPush(false); return }
            const tokensRes = await fetch(`/api/push_tokens?user_ids=${inactive.map(id => String(id)).join(',')}`)
            const tokens = await tokensRes.json()
            if (!tokens || tokens.length === 0) { showToast('발송할 토큰이 없어요.'); setIsSendingPush(false); return }
            await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '💪 오랫동안 활동이 없었어요!', body: '새로운 프로젝트가 기다리고 있어요. 지금 참여해보세요!', tokens: tokens.map((t: any) => t.token), userIds: inactive.map(id => String(id)) }) })
            showToast(`✅ 미활동자 ${inactive.length}명에게 발송됐어요!`)
            setIsSendingPush(false)
          }} disabled={isSendingPush} className="w-full bg-red-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400 cursor-pointer">
            {isSendingPush ? '발송 중...' : '미활동자에게 발송'}
          </button>
        </div>
      </div>
    </>
  )
}
