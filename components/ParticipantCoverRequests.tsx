'use client'

type Props = {
  coverRequests: any[]
  coverPenaltyUntil: string | null
  onAccept: (r: any) => void
  onReject: (r: any) => void
}

export default function ParticipantCoverRequests({ coverRequests, coverPenaltyUntil, onAccept, onReject }: Props) {
  const pendingRequests = coverRequests.filter(r => r.status === 'PENDING' && !coverPenaltyUntil)
  
  if (pendingRequests.length === 0) return null

  return (
    <>
      {pendingRequests.map(r => (
        <div key={r.id} className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-purple-800 mb-2">🎵 커버영상 미션 선택됐어요!</p>
          <p className="text-xs text-gray-600 mb-3">프로젝트: {r.project_code}</p>
          <p className="text-xs text-red-400 mb-3">⚠️ 24시간 이내 응답하지 않으면 거절로 처리됩니다.</p>
          <div className="flex gap-2">
            <button onClick={() => onAccept(r)} className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-sm font-medium">수락</button>
            <button onClick={() => onReject(r)} className="flex-1 bg-gray-400 text-white rounded-lg py-2 text-sm font-medium">거절</button>
          </div>
        </div>
      ))}
    </>
  )
}
