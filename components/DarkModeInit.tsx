'use client'
import { useEffect } from 'react'

export default function DarkModeInit() {
  useEffect(() => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.()

    // 다크모드 기본값 버전 체크 (네이티브 앱에서만: 앱은 항상 다크로 시작, 웹은 시스템 설정 따라감)
    if (isNative) {
      const darkModeVersion = localStorage.getItem('darkModeVersion')
      if (darkModeVersion !== '1') {
        if (!localStorage.getItem('theme')) {
          localStorage.setItem('theme', 'dark')
        }
        localStorage.setItem('darkModeVersion', '1')
      }
    }

    const applyTheme = () => {
      const theme = localStorage.getItem('theme')
      const html = document.documentElement
      if (theme === 'light') {
        html.classList.remove('dark')
      } else if (theme === 'dark') {
        html.classList.add('dark')
      } else {
        // theme이 없거나 'system'인 경우 -> 시스템 설정을 따름 (웹 기본값)
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        prefersDark ? html.classList.add('dark') : html.classList.remove('dark')
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
