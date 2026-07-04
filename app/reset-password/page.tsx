'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 세션 확인
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // 비밀번호 재설정 모드 활성화
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password) { setError('비밀번호를 입력해주세요.'); return }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('비밀번호 변경 실패! 다시 시도해주세요.')
      setLoading(false)
      return
    }

    // participants/users 테이블도 업데이트
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.from('participants').update({ password }).eq('email', user.email)
      await supabase.from('users').update({ password }).eq('email', user.email)
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/')
    }, 3000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-bold mb-2">비밀번호 변경 완료!</h1>
          <p className="text-sm text-gray-500">3초 후 로그인 페이지로 이동해요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">🔑 새 비밀번호 설정</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">새 비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="새 비밀번호 입력 (6자 이상)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="비밀번호 재입력"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400"
          >
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full border rounded-lg py-2 text-sm text-gray-600"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}