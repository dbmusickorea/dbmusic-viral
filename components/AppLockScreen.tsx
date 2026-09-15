'use client'
import { useState, useEffect, useRef } from 'react'
import { Fingerprint, Delete } from 'lucide-react'
import { authenticateBiometric, verifyLockPin, LockMethod } from '../app/lib/appLock'

type Props = {
  method: LockMethod
  onUnlock: () => void
}

export default function AppLockScreen({ method, onUnlock }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const triedOnce = useRef(false)

  const tryBiometric = async () => {
    setIsAuthenticating(true)
    setError(false)
    const ok = await authenticateBiometric()
    setIsAuthenticating(false)
    if (ok) onUnlock()
    else setError(true)
  }

  useEffect(() => {
    if (method === 'biometric' && !triedOnce.current) {
      triedOnce.current = true
      tryBiometric()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method])

  useEffect(() => {
    if (method === 'pin' && pin.length === 4) {
      verifyLockPin(pin).then(ok => {
        if (ok) {
          onUnlock()
        } else {
          setError(true)
          setPin('')
          setTimeout(() => setError(false), 500)
        }
      })
    }
  }, [pin, method])

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return
    setPin(prev => prev + num)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col items-center justify-center" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-8 dark:invert mb-10" />

      {method === 'biometric' ? (
        <div className="flex flex-col items-center gap-4">
          <button onClick={tryBiometric} disabled={isAuthenticating} className="w-20 h-20 rounded-full bg-blue-50 dark:bg-gray-800 flex items-center justify-center">
            <Fingerprint size={40} className="text-blue-600 dark:text-blue-400" />
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">{isAuthenticating ? '인증 중...' : '터치하여 잠금 해제'}</p>
          {error && <p className="text-xs text-red-500">인증에 실패했어요. 다시 시도해주세요.</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">비밀번호를 입력해주세요</p>
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : i < pin.length ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {['1','2','3','4','5','6','7','8','9'].map(n => (
              <button key={n} onClick={() => handleKeyPress(n)} className="w-16 h-16 rounded-full text-xl font-medium text-gray-800 dark:text-white active:bg-gray-100 dark:active:bg-gray-800">{n}</button>
            ))}
            <div />
            <button onClick={() => handleKeyPress('0')} className="w-16 h-16 rounded-full text-xl font-medium text-gray-800 dark:text-white active:bg-gray-100 dark:active:bg-gray-800">0</button>
            <button onClick={() => setPin(prev => prev.slice(0, -1))} className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800">
              <Delete size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
