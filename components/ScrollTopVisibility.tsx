'use client'

import { useEffect, useState } from 'react'

// 맨 위로 가기 버튼: 평소엔 숨기고 일정 거리 이상 스크롤 중일 때만 표시 (html 클래스 토글)
// 개별 페이지에 버튼이 없는 화면을 위해 전역 버튼도 함께 제공 (이미 있는 페이지에서는 숨김)
export default function ScrollTopVisibility() {
  const [duplicate, setDuplicate] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    let timer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      const existing = document.querySelector('.fixed.right-4.w-10.h-10.rounded-full:not([data-global-scroll-top])')
      setDuplicate(!!existing)
      if (window.scrollY > 200) {
        root.classList.add('show-scroll-top')
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => root.classList.remove('show-scroll-top'), 2500)
      } else {
        root.classList.remove('show-scroll-top')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) clearTimeout(timer)
      root.classList.remove('show-scroll-top')
    }
  }, [])

  if (duplicate) return null
  return (
    <button
      data-global-scroll-top
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed right-4 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 z-50"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
    >
      ↑
    </button>
  )
}
