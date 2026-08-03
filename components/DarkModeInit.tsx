'use client'
import { useEffect } from 'react'

export default function DarkModeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else if (theme === 'light') {
      html.classList.remove('dark')
    } else {
      // 시스템 설정 따름
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      prefersDark ? html.classList.add('dark') : html.classList.remove('dark')
    }
  }, [])
  return null
}
