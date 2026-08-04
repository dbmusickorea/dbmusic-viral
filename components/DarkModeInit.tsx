'use client'
import { useEffect } from 'react'

export default function DarkModeInit() {
  useEffect(() => {
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
