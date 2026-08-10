'use client'

import { useState, useEffect } from 'react'

export default function IdentityTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/v1/iamport.js'
    script.async = true
    script.onload = () => setSdkLoaded(true)
    script.onerror = () => setResult({ error: 'SDK 로드 실패' })
    document.head.appendChild(script)
  }, [])

  const handleVerify = async () => {
    setLoading(true)
    try {
      const IMP = (window as any).IMP
      if (!IMP) { setResult({ error: 'IMP SDK 로드 실패' }); setLoading(false); return }
      IMP.init('imp83548163')
      IMP.certification({
        merchant_uid: `identity-${Date.now()}`,
        pg: 'inicis_unified.MIIiasTest',
      }, (rsp: any) => {
        if (rsp.success) {
          setResult({ success: true, message: `본인인증 완료! imp_uid: ${rsp.imp_uid}` })
        } else {
          setResult({ error: rsp.error_msg })
        }
        setLoading(false)
      })
    } catch (e: any) {
      setResult({ error: e.message })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-8 mx-auto mb-6" />
        <h1 className="text-lg font-bold mb-2">본인인증 테스트</h1>
        <p className="text-xs text-gray-500 mb-6">KG이니시스 통합인증 서비스 테스트 페이지입니다.</p>
        <button
          onClick={handleVerify}
          disabled={loading || !sdkLoaded}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:bg-gray-300"
        >
          {!sdkLoaded ? 'SDK 로딩중...' : loading ? '인증 중...' : '본인인증 시작'}
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
