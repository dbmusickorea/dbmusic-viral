export type PassResult =
  | { ok: true; identityVerificationId: string }
  | { ok: false; message: string }

// 브라우저에서 포트원 V2 본인인증창 열기 (모바일은 인증 후 redirectPath로 돌아옴)
export async function requestPassVerification(redirectPath = '/identity-test'): Promise<PassResult> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
  if (!storeId || !channelKey) return { ok: false, message: '본인인증 설정이 없어요.' }
  const PortOne = await import('@portone/browser-sdk/v2')
  const identityVerificationId = `idv-${crypto.randomUUID()}`
  const res: any = await PortOne.requestIdentityVerification({
    storeId,
    identityVerificationId,
    channelKey,
    redirectUrl: `${window.location.origin}${redirectPath}`,
  })
  if (!res) return { ok: false, message: '인증 응답이 없어요.' }
  if (res.code) return { ok: false, message: res.message ?? '본인인증에 실패했어요.' }
  return { ok: true, identityVerificationId: res.identityVerificationId ?? identityVerificationId }
}

// 서버에서 인증이 실제로 완료됐는지 확인 (아직 가입 전이라 인증 불필요)
export async function checkIdentity(kind: 'participant' | 'client', identityVerificationId: string) {
  const res = await fetch('/api/identity/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, identityVerificationId }),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && data?.ok === true, ...data } as { ok: boolean; maskedName?: string; message?: string; code?: string }
}
