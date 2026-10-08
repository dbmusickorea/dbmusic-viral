'use client'

import { useEffect, useState } from 'react'
import { requestPassVerification, checkIdentity } from '../lib/identityClient'

export default function IdentityTestPage() {
  const [kind, setKind] = useState<'participant' | 'client'>('participant')
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const add = (m: string) => setLog((l) => [...l, m])

  // 모바일/앱: 인증창에서 돌아오면 주소에 결과가 붙어 있음
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('identityVerificationId')
    const code = q.get('code')
    if (code) add(`돌아옴: 실패 (${q.get('message') ?? code})`)
    else if (id) {
      add('돌아옴: 인증 창에서 복귀, 서버 확인 중...')
      checkIdentity('participant', id).then((r) => add(`서버 확인: ${JSON.stringify(r)}`))
    }
  }, [])

  const start = async () => {
    setLoading(true)
    setLog([])
    try {
      add('인증창 여는 중...')
      const r = await requestPassVerification('/identity-test')
      if (!r.ok) { add(`인증 실패: ${r.message}`); return }
      add(`인증창 완료: ${r.identityVerificationId}`)
      const c = await checkIdentity(kind, r.identityVerificationId)
      add(`서버 확인: ${JSON.stringify(c)}`)
    } catch (e: any) {
      add(`오류: ${e?.message ?? e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm">
        <h1 className="text-lg font-bold mb-1">본인인증 테스트 (V2)</h1>
        <p className="text-xs text-gray-500 mb-4">테스트 채널입니다. 실제 가입에는 영향이 없어요.</p>
        <div className="flex gap-2 mb-3">
          {(['participant', 'client'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`flex-1 rounded-lg py-2 text-sm border ${kind === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
              {k === 'participant' ? '체험단' : '의뢰인'}
            </button>
          ))}
        </div>
        <button onClick={start} disabled={loading} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium disabled:bg-gray-300">
          {loading ? '진행 중...' : '본인인증 시작'}
        </button>
        <pre className="mt-4 text-xs bg-gray-100 rounded-lg p-3 whitespace-pre-wrap break-all min-h-[60px]">{log.join('\n') || '결과가 여기에 표시돼요.'}</pre>
      </div>
    </div>
  )
}
