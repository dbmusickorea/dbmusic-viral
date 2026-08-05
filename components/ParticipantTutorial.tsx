'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParticipantTutorial({ onDone, onOpenSidebar, onCloseSidebar }: { onDone: () => void, onOpenSidebar?: () => void, onCloseSidebar?: () => void }) {
  const [step, setStep] = useState(0)
  const router = useRouter()

  const isMd = typeof window !== 'undefined' && window.innerWidth >= 768

  useEffect(() => {
    if (isMd) {
      onOpenSidebar?.()
    }
    return () => {
      if (isMd) onCloseSidebar?.()
    }
  }, [])
  const suffix = isMd ? '-sidebar' : ''

  const steps = [
    { target: `tutorial-tab-home${suffix}`, title: '기본 활동 규칙', description: '내 SNS 게시물에 미션 음원을 배경음악으로 매칭하여 업로드하면 미션 성공 시 현금 리워드가 즉시 적립돼요.', position: isMd ? 'right' : 'top' },
    { target: `tutorial-tab-home${suffix}`, title: '체험단 유형', description: '일반 체험단은 게시물에 신곡 음원(BGM)만 입혀 업로드하고, 커버 체험단은 직접 가창하여 업로드해요. 커버 체험단은 리워드가 추가 지급돼요!', position: isMd ? 'right' : 'top' },
    { target: `tutorial-tab-project${suffix}`, title: '미션 참여 방법', description: '새 캠페인 알림을 받으면 프로젝트 탭에서 참여 버튼을 클릭하세요. SNS에 음원 매칭 후 업로드한 링크를 앱에 등록하면 완료!', position: isMd ? 'right' : 'top' },
    { target: `tutorial-tab-wallet${suffix}`, title: '리워드 & 레벨업', description: '게시물 1개당 본인 레벨에 맞는 금액이 적립돼요. 레벨 1~50단계로 2,500원부터 1만원까지 단가가 올라가요!', position: isMd ? 'right' : 'top' },
    { target: `tutorial-tab-mypage${suffix}`, title: '추천인 코드 & 가이드', description: '내 추천인 코드로 가입 시 1명당 1단계 즉시 상승! 마이페이지에서 추천인 코드를 확인하고 자세한 가이드도 볼 수 있어요.', position: isMd ? 'right' : 'top' },
  ]

  const current = steps[step]
  const [highlightStyle, setHighlightStyle] = useState<any>({})

  useEffect(() => {
    const el = document.getElementById(current.target)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step])

  useEffect(() => {
    const getHighlightStyle = () => {
      const el = document.getElementById(current.target)
      if (!el) return {}
      const rect = el.getBoundingClientRect()
      return { top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }
    }
    const update = () => setHighlightStyle(getHighlightStyle())
    update()
    window.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [step])

  const getBubblePosition = () => {
    if (!highlightStyle.top) return {}
    if (current.position === 'top') {
      return { bottom: window.innerHeight - highlightStyle.top + 12, left: 16, right: 16 }
    }
    return { top: highlightStyle.top + highlightStyle.height + 12, left: 16, right: 16 }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] pointer-events-none" style={{ background: 'rgba(0,0,0,0.6)' }} />
      {highlightStyle.top && (
        <div className="fixed z-[101] rounded-xl pointer-events-none" style={{
          ...highlightStyle,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          border: '3px solid #60A5FA',
          background: 'rgba(255,255,255,0.15)',
        }} />
      )}
      <div className="fixed z-[102] bg-white rounded-2xl shadow-xl p-4" style={getBubblePosition()}>
        <div className="flex justify-between items-start mb-2">
          <p className="font-bold text-sm text-blue-600">{current.title}</p>
          <button onClick={onDone} className="text-xs text-gray-400">건너뛰기</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{current.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="text-xs px-3 py-1.5 border rounded-lg text-gray-600">이전</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg">다음</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { localStorage.setItem('participantTutorialDone', 'true'); router.push('/guide') }} className="text-xs px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg">가이드 보기</button>
                <button onClick={onDone} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg">완료</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-[99]" onClick={() => {}} />
    </>
  )
}
