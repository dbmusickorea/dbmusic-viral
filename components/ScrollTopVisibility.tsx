'use client'

import { useEffect } from 'react'

// 맨 위로 가기 버튼을 평소엔 숨기고, 일정 거리 이상 스크롤 중일 때만 보이게 함 (html 클래스 토글)
export default function ScrollTopVisibility() {
  useEffect(() => {
    const root = document.documentElement
    let timer: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
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
  return null
}
