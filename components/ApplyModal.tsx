'use client'

import { useState } from 'react'

type ApplyModalProps = {
  show: boolean
  onClose: () => void
  userInfo: any
}

export default function ApplyModal({ show, onClose, userInfo }: ApplyModalProps) {
  const [applyArtistName, setApplyArtistName] = useState('')
  const [applySongTitle, setApplySongTitle] = useState('')
  const [applyMissionDate, setApplyMissionDate] = useState('')
  const [applyHasCover, setApplyHasCover] = useState(false)
  const [applyCoverCount, setApplyCoverCount] = useState(0)
  const [applyRequirements, setApplyRequirements] = useState('')

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">📝 프로젝트 신청</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">가수명/아티스트명</label>
            <input value={applyArtistName} onChange={(e) => setApplyArtistName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="가수명 또는 아티스트명 입력" />
          </div>
          <div>
            <label className="text-sm font-medium">노래 제목</label>
            <input value={applySongTitle} onChange={(e) => setApplySongTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="노래 제목 입력" />
          </div>
          <div>
            <label className="text-sm font-medium">희망 미션 시작일</label>
            <input type="date" value={applyMissionDate} onChange={(e) => setApplyMissionDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={applyHasCover} onChange={(e) => setApplyHasCover(e.target.checked)} />
              커버 옵션 추가
            </label>
            {applyHasCover && (
              <div className="mt-2">
                <label className="text-sm font-medium">커버 인원</label>
                <input type="number" value={applyCoverCount} onChange={(e) => setApplyCoverCount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="커버 인원 수 입력" min={1} />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">요청사항</label>
            <textarea value={applyRequirements} onChange={(e) => setApplyRequirements(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={4} placeholder="요청사항 입력" />
          </div>
          <button onClick={async () => {
            if (!applyArtistName || !applySongTitle) { alert('가수명과 노래 제목을 입력해주세요.'); return }
            await fetch('/api/project_applications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                client_id: userInfo?.client_id,
                client_name: userInfo?.name,
                artist_name: applyArtistName,
                song_title: applySongTitle,
                mission_date: applyMissionDate,
                has_cover: applyHasCover,
                cover_count: applyCoverCount,
                requirements: applyRequirements,
                status: 'PENDING'
              })
            })
            alert('프로젝트 신청이 완료됐어요!')
            onClose()
            setApplyArtistName('')
            setApplySongTitle('')
            setApplyMissionDate('')
            setApplyHasCover(false)
            setApplyCoverCount(0)
            setApplyRequirements('')
          }} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">신청하기</button>
        </div>
      </div>
    </div>
  )
}
