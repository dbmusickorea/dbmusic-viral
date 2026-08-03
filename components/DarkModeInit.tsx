'use client'
import { useEffect } from 'react'

export default function DarkModeInit() {
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('theme')
      const html = document.documentElement
      if (theme === 'dark') {
        html.classList.add('dark')
      } else if (theme === 'light') {
        html.classList.remove('dark')
      } else {
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
