'use client'
import { useState, useEffect, useRef } from 'react'
import AppLockScreen from './AppLockScreen'
import { getLockSettings, LockMethod } from '../app/lib/appLock'

export default function AppLockGate({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false)
  const [method, setMethod] = useState<LockMethod | null>(null)
  const isLockedRef = useRef(false)

  useEffect(() => {
    const settings = getLockSettings()
    setMethod(settings.method)
    setIsLocked(settings.enabled)
    isLockedRef.current = settings.enabled

    if (!(window as any).Capacitor?.isNativePlatform?.()) return

    let removeListener: (() => void) | undefined
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        // 이미 잠금화면이 떠있는 동안(예: Face ID 인증창 표시/해제로 인한 추가 상태변화)에는
        // 다시 반응하지 않음 - 그렇지 않으면 인증 도중 잠금화면이 반복 재트리거됨
        if (isActive && !isLockedRef.current) {
          const s = getLockSettings()
          setMethod(s.method)
          if (s.enabled) {
            setIsLocked(true)
            isLockedRef.current = true
          }
        }
      }).then(handle => {
        removeListener = () => handle.remove()
      })
    })

    return () => { removeListener?.() }
  }, [])

  const handleUnlock = () => {
    isLockedRef.current = false
    setIsLocked(false)
  }

  return (
    <>
      {children}
      {isLocked && method && (
        <AppLockScreen method={method} onUnlock={handleUnlock} />
      )}
    </>
  )
}
