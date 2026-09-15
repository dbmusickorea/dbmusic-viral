'use client'
import { useState, useEffect, useRef } from 'react'
import AppLockScreen from './AppLockScreen'
import { getLockSettings, biometricAuthInProgress, LockMethod } from '../app/lib/appLock'

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

    // appStateChange(isActive)는 iOS에서 Face ID/컨트롤센터 등 "일시적 비활성"에도 반응해서
    // 진짜 백그라운드 전환이 아닌데도 반복 트리거되는 문제가 있음(캡시터 공식 문서에 명시된 동작).
    // 대신 진짜 백그라운드 전환에만 반응하는 pause/resume 이벤트를 사용
    let removeResumeListener: (() => void) | undefined
    let removePauseListener: (() => void) | undefined
    import('@capacitor/app').then(({ App }) => {
      App.addListener('resume', () => {
        if (isLockedRef.current) return
        // 안드로이드는 생체인증 팝업 자체가 진짜 pause/resume을 유발하므로,
        // 우리 앱이 직접 인증을 요청해서 생긴 재개 신호는 무시
        if (biometricAuthInProgress.current) return
        const s = getLockSettings()
        setMethod(s.method)
        if (s.enabled) {
          setIsLocked(true)
          isLockedRef.current = true
        }
      }).then(handle => {
        removeResumeListener = () => handle.remove()
      })

      App.addListener('pause', () => {
        // 필요 시 백그라운드 진입 처리(현재는 별도 동작 없음)
      }).then(handle => {
        removePauseListener = () => handle.remove()
      })
    })

    return () => {
      removeResumeListener?.()
      removePauseListener?.()
    }
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
