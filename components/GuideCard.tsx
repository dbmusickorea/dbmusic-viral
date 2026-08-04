'use client'
import { BookOpen, Pin } from 'lucide-react'

import { useState } from 'react'

export default function GuideCard() {
  const [open, setOpen] = useState(false)
  const [openItem, setOpenItem] = useState<number | null>(null)

  const guides = [
    { title: '계약된 가수 및 곡명 선택 후 실시간 확인', content: '더블비뮤직과 계약된 가수 및 곡명을 클릭하면 캠페인 진행상황을 실시간으로 모니터링할 수 있습니다.' },
    { title: '계약서 다운로드', content: '상단 메뉴에서 계약서를 언제든지 다운로드할 수 있습니다.' },
    { title: '결과보고서 자동 생성', content: '프로젝트 종료와 동시에 결과보고서가 자동으로 생성됩니다. 별도 요청 없이 앱에서 바로 확인 가능합니다.' },
    { title: '하단 바를 통한 페이지 이동', content: '하단 네비게이션 바를 통해 대시보드, 게시물 목록, 결과보고서, 계약서 등 각 페이지로 빠르게 이동합니다.' },
  ]

  const notices = [
    { title: '커버 옵션 선택 시', content: '커버를 옵션으로 선택한 경우, 커버 페이지에서 커버할 대상을 직접 선택할 수 있습니다. 선택 후 수락하면 커버 작업이 진행됩니다.' },
    { title: '게시물 링크 바로가기', content: "게시물 목록에서 '링크보기'를 누르면 게시자의 실제 계정으로 바로 이동하여 업로드된 콘텐츠를 직접 확인할 수 있습니다." },
    { title: '총 음원사용량 안내', content: '표시되는 총 음원사용량은 체험단을 포함한 전세계 총 사용량을 의미합니다.' },
    { title: '요청사항을 통한 체험단과 소통', content: '요청사항란은 체험단과 소통하는 창구이며 게시물에 들어갈 필수 문구와 해시태그를 적어주시면 됩니다.' },
  ]

  return (
    <div id="tutorial-guide-card" className="bg-white dark:bg-gray-800 rounded-2xl shadow mb-4 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex justify-between items-center p-4">
        <div>
          <p className="font-bold text-sm text-left dark:text-white flex items-center gap-1"><BookOpen size={14} /> 더블비뮤직 앱 사용 가이드</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-left mt-0.5">의뢰인을 위한 간편한 캠페인 관리 프로세스</p>
        </div>
        <svg viewBox="0 0 24 24" className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t dark:border-gray-700 pt-3">
          <div className="space-y-2 mb-4">
            {guides.map((g, i) => (
              <div key={i} className="border dark:border-gray-600 rounded-xl overflow-hidden">
                <button onClick={() => setOpenItem(openItem === i ? null : i)} className="w-full flex justify-between items-center p-3">
                  <p className="text-sm font-medium text-left dark:text-white">{i + 1}. {g.title}</p>
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openItem === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openItem === i && <p className="text-xs text-gray-600 dark:text-gray-300 px-3 pb-3">{g.content}</p>}
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1"><Pin size={12} /> 주요 안내사항</p>
          <div className="space-y-2">
            {notices.map((n, i) => (
              <div key={i} className="border dark:border-gray-600 rounded-xl overflow-hidden">
                <button onClick={() => setOpenItem(openItem === i + 10 ? null : i + 10)} className="w-full flex justify-between items-center p-3">
                  <p className="text-sm font-medium text-left dark:text-white">{n.title}</p>
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${openItem === i + 10 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openItem === i + 10 && <p className="text-xs text-gray-600 dark:text-gray-300 px-3 pb-3">{n.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
