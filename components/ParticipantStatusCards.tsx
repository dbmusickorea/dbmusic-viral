'use client'
import { Ban, Music, Lock, AlertTriangle } from 'lucide-react'

type Props = {
  bannedUntil: string | null
  banReason: string | null
  coverPenaltyUntil: string | null
  coverPenaltyReason: string | null
  isLocked: boolean
  unlockCommentCount: number
}

export default function ParticipantStatusCards({ bannedUntil, banReason, coverPenaltyUntil, coverPenaltyReason, isLocked, unlockCommentCount }: Props) {
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-0.5"><AlertTriangle size={10} /> 유튜브 영상에 댓글 10회 작성 시 자동으로 해제됩니다.</p>
        </div>
      )}
    </>
  )
}
