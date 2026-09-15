'use client'
import { useState, useEffect } from 'react'
import AppLockScreen from './AppLockScreen'
import { getLockSettings, LockMethod } from '../app/lib/appLock'

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false)
  const [method, setMethod] = useState<LockMethod | null>(null)

  useEffect(() => {
    const settings = getLockSettings()
    setMethod(settings.method)
    setIsLocked(settings.enabled)

    if (!(window as any).Capacitor?.isNativePlatform?.()) return

    let removeListener: (() => void) | undefined
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive) {
          const s = getLockSettings()
          setMethod(s.method)
          if (s.enabled) setIsLocked(true)
        }
      }).then(handle => {
        removeListener = () => handle.remove()
      })
    })

    return () => { removeListener?.() }
  }, [])

  return (
    <>
      {children}
      {isLocked && method && (
        <AppLockScreen method={method} onUnlock={() => setIsLocked(false)} />
      )}
    </>
  )
}
