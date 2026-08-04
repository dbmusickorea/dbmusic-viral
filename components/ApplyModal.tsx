'use client'

import { useState } from 'react'
import { supabase } from '../app/lib/supabase'

type ApplyModalProps = {
  show: boolean
  onClose: () => void
  userInfo: any
  showToast?: (msg: string, type?: any) => void
}

export default function ApplyModal({ show, onClose, userInfo, showToast }: ApplyModalProps) {
  const [applyArtistName, setApplyArtistName] = useState('')
  const [applySongTitle, setApplySongTitle] = useState('')
  const [applyMissionDate, setApplyMissionDate] = useState('')
  const [applyHasCover, setApplyHasCover] = useState(false)
  const [applyCoverCount, setApplyCoverCount] = useState(0)
  const [applyRequirements, setApplyRequirements] = useState('')
  const [applyBudget, setApplyBudget] = useState('')
  const [applyJacketFile, setApplyJacketFile] = useState<File | null>(null)

  if (!show) return null

  const handleSubmit = async () => {
    if (!applyArtistName || !applySongTitle) {
      showToast ? showToast('가수명과 노래 제목을 입력해주세요.', 'error') : alert('가수명과 노래 제목을 입력해주세요.')
      return
    }
    let jacketImageUrl = null
    if (applyJacketFile) {
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(`jacket_${Date.now()}`, applyJacketFile, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path)
        jacketImageUrl = urlData.publicUrl
      }
    }
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
        budget: applyBudget || null,
        jacket_image: jacketImageUrl,
        status: 'PENDING'
      })
    })
    showToast ? showToast('프로젝트 신청이 완료됐어요!') : alert('프로젝트 신청이 완료됐어요!')
    onClose()
    setApplyArtistName('')
    setApplySongTitle('')
    setApplyMissionDate('')
    setApplyHasCover(false)
    setApplyCoverCount(0)
    setApplyRequirements('')
    setApplyBudget('')
    setApplyJacketFile(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg dark:text-white">📝 프로젝트 신청</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-300 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium dark:text-white">가수명/아티스트명</label>
            <input value={applyArtistName} onChange={(e) => setApplyArtistName(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="가수명 또는 아티스트명 입력" />
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">노래 제목</label>
            <input value={applySongTitle} onChange={(e) => setApplySongTitle(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="노래 제목 입력" />
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">희망 미션 시작일 (음원 발매일)</label>
            <input type="date" value={applyMissionDate} onChange={(e) => setApplyMissionDate(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium dark:text-white">
              <input type="checkbox" checked={applyHasCover} onChange={(e) => setApplyHasCover(e.target.checked)} />
              커버 옵션 추가
            </label>
            {applyHasCover && (
              <div className="mt-2">
                <label className="text-sm font-medium dark:text-white">커버 인원</label>
                <input type="number" value={applyCoverCount} onChange={(e) => setApplyCoverCount(Number(e.target.value))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="커버 인원 수 입력" min={1} />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">책정 예산</label>
            <input type="number" value={applyBudget} onChange={(e) => setApplyBudget(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="예산 입력 (원)" />
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">자켓 이미지</label>
            <input type="file" accept="image/*" onChange={(e) => setApplyJacketFile(e.target.files?.[0] ?? null)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="text-sm font-medium dark:text-white">요청사항</label>
            <textarea value={applyRequirements} onChange={(e) => setApplyRequirements(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400" rows={4} placeholder="요청사항 입력" />
          </div>
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium">신청하기</button>
        </div>
      </div>
    </div>
  )
}
