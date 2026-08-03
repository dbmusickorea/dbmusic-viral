'use client'
import PlatformIcon from './PlatformIcon'

type Props = {
  participants: any[]
  selectedParticipantId: number | null
  setSelectedParticipantId: (id: number | null) => void
  participantPage: number
  setParticipantPage: (page: number | ((p: number) => number)) => void
  PAGE_SIZE: number
  onCancelParticipation: (id: number, name: string, memberId: number) => void
}

export default function AdminParticipantList({ participants, selectedParticipantId, setSelectedParticipantId, participantPage, setParticipantPage, PAGE_SIZE, onCancelParticipation }: Props) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white">👥 참여자 목록 ({participants.length}명)</h2>
        {selectedParticipantId && (
          <button onClick={() => setSelectedParticipantId(null)} className="text-xs text-gray-500 dark:text-gray-400 border dark:border-gray-600 rounded px-2 py-1">전체보기</button>
        )}
      </div>
      {participants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">참여자가 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {participants.slice(participantPage * PAGE_SIZE, (participantPage + 1) * PAGE_SIZE).map((p) => (
              <div key={p.id} onClick={() => setSelectedParticipantId(selectedParticipantId === p.member_id ? null : p.member_id)} className={`border dark:border-gray-600 rounded-lg p-3 cursor-pointer ${selectedParticipantId === p.member_id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'dark:bg-gray-700'}`}>
                <p className="text-sm font-medium dark:text-white">{p.participants?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">📱 {p.participants?.mobile}</p>
                {p.participants?.instagram_id && <p className="text-xs text-gray-500 dark:text-gray-400"><PlatformIcon platform="instagram" size={12} className="inline mr-1" /> <a href={`https://www.instagram.com/${p.participants.instagram_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.instagram_id}</a>{p.participants?.instagram_followers > 0 && ` (${p.participants.instagram_followers.toLocaleString()}명)`}</p>}
                {p.participants?.youtube_id && <p className="text-xs text-gray-500 dark:text-gray-400"><PlatformIcon platform="youtube" size={12} className="inline mr-1" /> <a href={`https://www.youtube.com/@${p.participants.youtube_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.youtube_id}</a>{p.participants?.youtube_subscribers > 0 && ` (${p.participants.youtube_subscribers.toLocaleString()}명)`}</p>}
                {p.participants?.tiktok_id && <p className="text-xs text-gray-500 dark:text-gray-400"><PlatformIcon platform="tiktok" size={12} className="inline mr-1" /> <a href={`https://www.tiktok.com/@${p.participants.tiktok_id.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 underline hover:text-blue-800">{p.participants?.tiktok_id}</a>{p.participants?.tiktok_followers > 0 && ` (${p.participants.tiktok_followers.toLocaleString()}명)`}</p>}
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">참여일: {new Date(p.joined_at).toLocaleDateString('ko-KR')}</p>
                  <button onClick={(e) => { e.stopPropagation(); onCancelParticipation(p.id, p.participants?.name, p.member_id) }} className="text-xs text-red-500 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50">참여취소</button>
                </div>
              </div>
            ))}
          </div>
          {participants.length > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => setParticipantPage(p => Math.max(0, p - 1))} disabled={participantPage === 0} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">이전</button>
              <div className="flex gap-1">
                {Array.from({length: Math.ceil(participants.length / PAGE_SIZE)}, (_, i) => (
                  <button key={i} onClick={() => setParticipantPage(i)} className={`text-xs px-2 py-1 border dark:border-gray-600 rounded ${participantPage === i ? 'bg-blue-600 text-white border-blue-600' : 'dark:text-gray-300'}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setParticipantPage(p => Math.min(Math.ceil(participants.length / PAGE_SIZE) - 1, p + 1))} disabled={(participantPage + 1) * PAGE_SIZE >= participants.length} className="text-xs px-3 py-1 border dark:border-gray-600 dark:text-gray-300 rounded disabled:opacity-30">다음</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
