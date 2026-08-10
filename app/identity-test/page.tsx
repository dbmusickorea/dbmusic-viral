'use client'

import { useState } from 'react'

export default function IdentityTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    try {
      const { default: PortOne } = await import('@portone/browser-sdk' as any)
      const response = await PortOne.requestIdentityVerification({
        storeId: 'store-b5f234bc-e8a4-437f-8c63-9e3e0c8ef0be',
        channelKey: 'channel-key-82086643-eab7-4f83-958e-c99b37a6b240',
        identityVerificationId: `identity-${Date.now()}`,
      })
      if (response?.code) {
        setResult({ error: response.message })
      } else {
        setResult({ success: true, message: '본인인증 완료!' })
      }
    } catch (e: any) {
      setResult({ error: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-8 mx-auto mb-6" />
        <h1 className="text-lg font-bold mb-2">본인인증 테스트</h1>
        <p className="text-xs text-gray-500 mb-6">KG이니시스 통합인증 서비스 테스트 페이지입니다.</p>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:bg-gray-300"
        >
          {loading ? '인증 중...' : '본인인증 시작'}
        </button>
        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {result.error ?? result.message}
          </div>
        )}
      </div>
    </div>
  )
}
