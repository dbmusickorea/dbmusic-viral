'use client'
import { useEffect } from 'react'

export default function GlobalErrorLogger() {
  useEffect(() => {
    const sendLog = async (message: string, stack?: string) => {
      try {
        let userInfo: any = null
        let userRole: string | null = null
        try {
          userInfo = JSON.parse(localStorage.getItem('userInfo') ?? 'null')
          userRole = localStorage.getItem('userRole')
        } catch {}

        let platform = 'web'
        let appVersion: string | undefined
        try {
          const cap = (window as any).Capacitor
          if (cap?.isNativePlatform?.()) {
            platform = cap.getPlatform?.() ?? 'native'
            const { App } = await import('@capacitor/app')
            const info = await App.getInfo()
            appVersion = info.version
          }
        } catch {}

        await fetch('/api/error-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: userInfo?.id ?? null,
            user_role: userRole,
            page_path: window.location.pathname,
            error_message: message,
            error_stack: stack,
            platform,
            app_version: appVersion,
            user_agent: navigator.userAgent,
          })
        })
      } catch {
      }
    }

    const handleError = (event: ErrorEvent) => {
      sendLog(event.message ?? String(event.error), event.error?.stack)
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message ?? String(reason)
      sendLog(`[UnhandledRejection] ${message}`, reason?.stack)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
