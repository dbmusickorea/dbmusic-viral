'use client'
import { useParticipant } from '../contexts/ParticipantContext'
import MissionForm from './MissionForm'

export default function ParticipantMyParticipations({ getRequirements, handleCancelParticipation }: { getRequirements: (code: string) => void, handleCancelParticipation: (p: any) => void }) {
  const {
    showParticipation, myParticipations, participationFilter, setParticipationFilter,
    selectedParticipation, setSelectedParticipation, participationPage, setParticipationPage,
    PAGE_SIZE, setProjectCode, setProjectInfo, myPosts, myRankMap,
  } = useParticipant()

  if (!showParticipation || myParticipations.length === 0) return null

  const filteredParticipations = participationFilter === 'current'
    ? myParticipations.filter((p: any) => ['ONGOING', 'PENDING'].includes(p.projects?.status))
    : myParticipations

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <h2 className="font-bold mb-3">✅ 내 참여 현황</h2>
      <div className="flex gap-2 mb-3">
        <button onClick={() => { setParticipationFilter('current'); setSelectedParticipation(null) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${participationFilter === 'current' ? 'bg-blue-600 text-white' : 'border'}`}>진행중</button>
        <button onClick={() => { setParticipationFilter('all'); setSelectedParticipation(null) }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${participationFilter === 'all' ? 'bg-blue-600 text-white' : 'border'}`}>전체</button>
      </div>
      <div className="space-y-2">
        {filteredParticipations.slice(participationPage * PAGE_SIZE, (participationPage + 1) * PAGE_SIZE).map((p: any) => (
          <div key={p.id} className={`border rounded-lg p-3 cursor-pointer ${selectedParticipation?.project_code === p.project_code ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => {
            if (selectedParticipation?.project_code === p.project_code) {
              setSelectedParticipation(null)
              setProjectCode('')
              setProjectInfo(null)
            } else {
              setSelectedParticipation(p)
              setProjectCode(p.project_code)
              getRequirements(p.project_code)
            }
          }}>
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                {p.projects?.cover_image_url && (
                  <img src={p.projects.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.projects?.artist_name || p.projects?.client_name} / {p.projects?.song_title ?? p.projects?.product_content}</p>
                  <p className="text-xs text-gray-400">프로젝트 코드: {p.project_code}</p>
                  {myPosts.some((post: any) => post.project_code?.toUpperCase() === p.project_code?.toUpperCase() && post.is_cover) && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🎵 COVER</span>
                  )}
                  <p className="text-xs text-gray-500">미션일: {p.projects?.start_date ?? '미정'}</p>
                  {p.projects?.end_date && (
                    <p className="text-xs text-gray-500">종료일: {new Date(p.projects.end_date).toLocaleDateString('ko-KR')}</p>
                  )}
                  {myRankMap[p.project_code] && (
                    <div className="mt-1">
                      <p className="text-xs font-medium text-blue-600">
                        {myRankMap[p.project_code].rank}위 / 전체 {myRankMap[p.project_code].total}명 중
                      </p>
                      {!myRankMap[p.project_code].isEligible && (
                        <p className="text-xs text-gray-400">(좋아요 1,000건 미만 시상 제외)</p>
                      )}
                      <p className="text-xs text-gray-500">❤️ {myRankMap[p.project_code].likes?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                p.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                p.projects?.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                'bg-green-100 text-green-700'
              }`}>
                {p.status === 'CANCELLED' ? '취소됨 ❌' : p.projects?.status === 'COMPLETED' ? '종료 ✅' : '참여중 🟢'}
              </span>
            </div>
            {p.cover_requested && !p.is_cover && (
              <p className="mt-2 text-xs text-purple-500 text-center">🎵 커버 신청 완료 (의뢰인 검토 중)</p>
            )}
            {p.status !== 'CANCELLED' && p.projects?.status === 'ONGOING' && p.joined_at &&
              (new Date().getTime() - new Date(p.joined_at).getTime()) < 3 * 60 * 60 * 1000 && (
              <button onClick={(e) => { e.stopPropagation(); handleCancelParticipation(p) }} className="mt-2 w-full text-xs text-red-400 border border-red-200 rounded-lg py-1.5">참여 취소 (3시간 이내 가능)</button>
            )}
          </div>
        ))}
        {selectedParticipation && (
          <div className="mt-3 border-t pt-3">
            <div className="bg-gray-50 rounded-lg p-3 mb-3 flex gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold mb-2">{selectedParticipation.projects?.artist_name || selectedParticipation.projects?.client_name} - {selectedParticipation.projects?.song_title}</p>
                <p className="text-xs text-gray-500">시작일: {selectedParticipation.projects?.start_date ?? '미정'}{selectedParticipation.projects?.start_time ? ` ${selectedParticipation.projects.start_time}` : ''}</p>
                <p className="text-xs text-gray-500">종료일: {selectedParticipation.projects?.end_date ?? '미정'}</p>
                <p className="text-xs text-gray-500">진행일수: {selectedParticipation.projects?.start_date ? Math.floor((new Date().getTime() - new Date(selectedParticipation.projects.start_date).getTime()) / (1000 * 60 * 60 * 24)) + '일째' : '미정'}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${selectedParticipation.projects?.status === 'ONGOING' ? 'bg-green-100 text-green-700' : selectedParticipation.projects?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedParticipation.projects?.status === 'ONGOING' ? '진행중' : selectedParticipation.projects?.status === 'PENDING' ? '대기중' : '완료'}
                </span>
              </div>
              {selectedParticipation.projects?.cover_image_url && (
                <img src={selectedParticipation.projects.cover_image_url} className="max-h-24 aspect-square rounded-lg object-cover shrink-0" />
              )}
            </div>
            {/* 미션 제출 폼 */}
            <MissionForm selectedParticipation={selectedParticipation} />
          </div>
        )}
      </div>
      {filteredParticipations.length > PAGE_SIZE && (
        <div className="flex justify-between items-center mt-3">
          <button onClick={() => setParticipationPage((p: any) => Math.max(0, p - 1))} disabled={participationPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
          <div className="flex gap-1">
            {Array.from({length: Math.ceil(filteredParticipations.length / PAGE_SIZE)}, (_, i) => (
              <button key={i} onClick={() => setParticipationPage(i)} className={`text-xs px-2 py-1 border rounded ${participationPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
            ))}
          </div>
          <button onClick={() => setParticipationPage((p: any) => Math.min(Math.ceil(filteredParticipations.length / PAGE_SIZE) - 1, p + 1))} disabled={(participationPage + 1) * PAGE_SIZE >= filteredParticipations.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
        </div>
      )}
    </div>
  )
}
