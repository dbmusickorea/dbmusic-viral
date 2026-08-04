'use client'
import { useEffect } from 'react'

export default function DarkModeInit() {
  useEffect(() => {
    // 다크모드 기본값 버전 체크 (기존 사용자 포함)
    const darkModeVersion = localStorage.getItem('darkModeVersion')
    if (darkModeVersion !== '1') {
      if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'dark')
      }
      localStorage.setItem('darkModeVersion', '1')
    }

    const applyTheme = () => {
      const theme = localStorage.getItem('theme')
      const html = document.documentElement
      if (theme === 'light') {
        html.classList.remove('dark')
      } else if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        prefersDark ? html.classList.add('dark') : html.classList.remove('dark')
      } else {
        // 기본값: 다크모드
        html.classList.add('dark')
        if (!theme) localStorage.setItem('theme', 'dark')
      }
    }

    applyTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'system') {
        applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  return null
}
