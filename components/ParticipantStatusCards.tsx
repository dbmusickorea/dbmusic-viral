'use client'
import { useState } from 'react'
import { Ban, Music, Lock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  bannedUntil: string | null
  banReason: string | null
  coverPenaltyUntil: string | null
  coverPenaltyReason: string | null
  isLocked: boolean
  unlockCommentCount: number
  unlockVideos?: { id: number; video_id: string; video_url: string; title: string | null }[]
  youtubeHandle: string
  setYoutubeHandle: (v: string) => void
  isVerifying: boolean
  verifyingUnlockVideoId: string | null
  commentMissions: any[]
  handleCommentVerify: (videoId: string, projectCode: string) => Promise<void>
}

export default function ParticipantStatusCards({ bannedUntil, banReason, coverPenaltyUntil, coverPenaltyReason, isLocked, unlockCommentCount, unlockVideos = [], youtubeHandle, setYoutubeHandle, isVerifying, verifyingUnlockVideoId, commentMissions, handleCommentVerify }: Props) {
  const [showUnlockPanel, setShowUnlockPanel] = useState(false)
  return (
    <>
      {bannedUntil && (
        <div className="bg-orange-50 dark:bg-gray-700 border-l-4 border-orange-400 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-200 mb-1 flex items-center gap-1"><Ban size={14} /> 활동제한 중</p>
          {bannedUntil !== 'banned' && (
            <>
              <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">해제일: {new Date(bannedUntil).toLocaleDateString('ko-KR')}</p>
              <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">남은 기간: {Math.ceil((new Date(bannedUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일</p>
            </>
          )}
          {banReason && <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">사유: {banReason}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-0.5"><AlertTriangle size={10} /> 제한 기간 동안 미션 제출이 불가능해요. 기간 만료 후 자동으로 해제됩니다.</p>
        </div>
      )}
      {coverPenaltyUntil && new Date(coverPenaltyUntil) > new Date() && (
        <div className="bg-orange-50 dark:bg-gray-700 border-l-4 border-orange-400 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-200 mb-1">
            {coverPenaltyReason === 'deleted' ? '커버 게시물 삭제 페널티' : '커버 미업로드 페널티'}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">해제일: {new Date(coverPenaltyUntil).toLocaleDateString('ko-KR')}</p>
          <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">남은 기간: {Math.ceil((new Date(coverPenaltyUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-0.5"><AlertTriangle size={10} /> 페널티 기간 동안 커버 미션 참여가 제한됩니다.</p>
        </div>
      )}
      {isLocked && (
        <div className="bg-orange-50 dark:bg-gray-700 border-l-4 border-orange-400 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-200 mb-1 flex items-center gap-1"><Lock size={14} /> 계정 잠금 중</p>
          <p className="text-xs text-orange-600 dark:text-orange-200 mb-1">댓글 인증: {unlockCommentCount}/10 완료</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-0.5"><AlertTriangle size={10} /> 아래 영상에 댓글 10개 작성 시 자동으로 해제됩니다.</p>

          <button onClick={() => setShowUnlockPanel(!showUnlockPanel)} className="w-full mt-2 text-xs font-medium text-orange-700 dark:text-orange-200 flex items-center justify-center gap-1 py-1.5">
            {showUnlockPanel ? <>접기 <ChevronUp size={12} /></> : <>펼쳐서 댓글 달기 <ChevronDown size={12} /></>}
          </button>

          {showUnlockPanel && (
            <div className="mt-1 space-y-2">
              <div>
                <label className="text-xs font-medium text-orange-700 dark:text-orange-200">유튜브 계정명</label>
                <input value={youtubeHandle} onChange={(e) => setYoutubeHandle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-600 dark:text-white" placeholder="@계정명 또는 닉네임" />
              </div>
              {unlockVideos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">등록된 영상이 없어요.</p>
              ) : (
                unlockVideos.map((v) => {
                  const done = commentMissions.some(m => m.video_id === v.video_id && m.project_code === 'UNLOCK')
                  return (
                    <div key={v.id} className="bg-white dark:bg-gray-600 rounded-lg p-2.5 space-y-1.5">
                      <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 truncate">
                        🔗 {v.title || '락 해제용 영상'}
                      </a>
                      <button
                        onClick={() => handleCommentVerify(v.video_id, '')}
                        disabled={verifyingUnlockVideoId !== null || done}
                        className="w-full text-xs bg-orange-500 text-white rounded-lg py-1.5 font-medium disabled:bg-gray-400"
                      >
                        {done ? '인증 완료' : verifyingUnlockVideoId === v.video_id ? '인증 중...' : '댓글 인증하기'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
