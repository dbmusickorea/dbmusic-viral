import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export type IdentityKind = 'participant' | 'client'

export type VerifiedIdentity = {
  name: string | null
  birthDate: string | null
  phone: string | null
  ciHash: string
}

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 포트원 V2에서 본인인증 결과를 서버가 직접 조회 (클라이언트가 보낸 값은 믿지 않음)
async function fetchVerified(verificationId: string): Promise<VerifiedIdentity | null | 'NO_CI'> {
  const secret = process.env.PORTONE_V2_API_SECRET
  if (!secret) throw new Error('PORTONE_V2_API_SECRET 환경변수가 없어요')
  // 인증창이 닫힌 직후에는 포트원 쪽 반영이 늦을 수 있어 짧게 재시도
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(verificationId)}`,
      { headers: { Authorization: `PortOne ${secret}` }, cache: 'no-store' }
    )
    const data = await res.json().catch(() => ({}))
    const c = data?.verifiedCustomer
    if (res.ok && data?.status === 'VERIFIED' && !c?.ci) {
      console.warn('[identity] 인증은 됐지만 CI가 없어요', { name: !!c?.name, phone: !!c?.phoneNumber, di: !!c?.di })
      return 'NO_CI'
    }
    if (res.ok && data?.status === 'VERIFIED' && c?.ci) {
      return {
        name: c.name ?? null,
        birthDate: c.birthDate ?? null,
        phone: c.phoneNumber ?? null,
        ciHash: crypto.createHash('sha256').update(String(c.ci)).digest('hex'),
      }
    }
    console.warn('[identity] 인증 미확인', { attempt, http: res.status, status: data?.status, type: data?.type })
    if (attempt < 3) await new Promise((r) => setTimeout(r, 800))
  }
  return null
}

export type PrecheckResult =
  | { ok: true; identity: VerifiedIdentity }
  | { ok: false; code: 'NOT_VERIFIED' | 'ID_USED' | 'DUPLICATE_CI' | 'NO_CI'; message: string }

// 가입/연결 전에 호출: 실제로 인증됐는지, 이미 쓰인 인증/사람인지 확인
export async function precheckVerification(
  kind: IdentityKind,
  verificationId: string,
  allowRefId?: number
): Promise<PrecheckResult> {
  const identity = await fetchVerified(verificationId)
  if (identity === 'NO_CI') return { ok: false, code: 'NO_CI', message: '이 인증 수단은 사용할 수 없어요. 다른 인증 수단(PASS인증서 등)으로 다시 인증해주세요.' }
  if (!identity) return { ok: false, code: 'NOT_VERIFIED', message: '본인인증이 확인되지 않았어요. 다시 인증해주세요.' }

  const db = admin()
  const { data: used } = await db
    .from('identity_verifications')
    .select('id')
    .eq('verification_id', verificationId)
    .maybeSingle()
  if (used) return { ok: false, code: 'ID_USED', message: '이미 사용된 인증이에요. 다시 인증해주세요.' }

  const { data: dup } = await db
    .from('identity_verifications')
    .select('id, ref_id')
    .eq('kind', kind)
    .eq('ci_hash', identity.ciHash)
    .maybeSingle()
  if (dup && !(allowRefId != null && dup.ref_id === allowRefId)) {
    return { ok: false, code: 'DUPLICATE_CI', message: '이미 본인인증으로 가입된 사용자예요.' }
  }
  return { ok: true, identity }
}

// 계정이 만들어진 뒤(또는 기존 회원 연결 시) 호출: 기록 저장 + is_verified 표시
export async function recordVerification(
  kind: IdentityKind,
  verificationId: string,
  refId: number,
  identity: VerifiedIdentity
) {
  const db = admin()
  const { error } = await db.from('identity_verifications').upsert(
    {
      kind,
      ref_id: refId,
      verification_id: verificationId,
      name: identity.name,
      birth_date: identity.birthDate,
      phone: identity.phone,
      ci_hash: identity.ciHash,
    },
    { onConflict: 'kind,ci_hash' }
  )
  if (error) throw new Error(error.message)
  const table = kind === 'participant' ? 'participants' : 'users'
  const { error: upErr } = await db.from(table).update({ is_verified: true }).eq('id', refId)
  if (upErr) throw new Error(upErr.message)
}
