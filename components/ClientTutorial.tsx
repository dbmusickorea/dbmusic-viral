'use client'

import { useState, useEffect } from 'react'

export default function ClientTutorial({ onDone, onOpenSidebar, onCloseSidebar }: { onDone: () => void, onOpenSidebar?: () => void, onCloseSidebar?: () => void }) {
  const [step, setStep] = useState(0)

  const isMd = typeof window !== 'undefined' && window.innerWidth >= 768
  const [sidebarReady, setSidebarReady] = useState(!isMd)
  const sidebarNeededSteps = isMd ? [1, 2, 3, 4] : []

  useEffect(() => {
    if (isMd) {
      if (sidebarNeededSteps.includes(step)) {
        onOpenSidebar?.()
        setTimeout(() => setSidebarReady(true), 500)
      } else {
        onCloseSidebar?.()
        setSidebarReady(true)
      }
    } else {
      setSidebarReady(true)
    }
    return () => {
      if (isMd) onCloseSidebar?.()
    }
  }, [step])

  const suffix = isMd ? '-sidebar' : ''

  const steps = [
    { target: 'tutorial-project-card', title: '프로젝트 선택', description: '계약된 가수 및 곡명을 클릭하면 캠페인 진행상황을 실시간으로 모니터링할 수 있어요.', position: 'bottom' },
    { target: isMd ? 'tutorial-stats-btn-sidebar' : 'tutorial-bottom-nav', title: '탭 네비게이션', description: '프로젝트, 현황, 신청, 보고서, 마이페이지 등 각 페이지로 빠르게 이동할 수 있어요.', position: 'top' },
    { target: `tutorial-stats-btn${suffix}`, title: '현황 탭', description: '실시간으로 좋아요, 댓글, 조회수 등 통계를 확인할 수 있어요.', position: 'top' },
    { target: `tutorial-apply-btn${suffix}`, title: '프로젝트 신청', description: '새로운 프로젝트를 신청할 수 있어요. 가수명, 노래제목, 희망 시작일 등을 입력해주세요.', position: 'top' },
    { target: `tutorial-report-btn${suffix}`, title: '보고서 탭', description: '프로젝트 종료 후 결과보고서를 PDF, 워드, 엑셀로 다운로드할 수 있어요.', position: 'top' },
    { target: 'tutorial-inquiry-card', title: '프로젝트 문의', description: '진행 중인 프로젝트에 대해 궁금한 점을 문의할 수 있어요. 더블비뮤직 담당자가 빠르게 답변드려요.', position: 'bottom' },
    { target: 'tutorial-guide-card', title: '앱 사용 가이드', description: '더블비뮤직 앱 사용 방법을 자세히 안내해드려요. 펼쳐서 확인해보세요!', position: 'bottom' },
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
    // 아이패드에서 사이드바 버튼 하이라이트는 말풍선을 아래로
    if (isMd && sidebarNeededSteps.includes(step)) {
      return { top: highlightStyle.top + highlightStyle.height + 12, left: highlightStyle.left + highlightStyle.width + 12, right: 16 }
    }
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
              <button onClick={onDone} className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg">완료</button>
            )}
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-[99]" onClick={() => {}} />
    </>
  )
}
