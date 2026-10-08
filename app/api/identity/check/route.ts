import { NextRequest, NextResponse } from 'next/server'
import { precheckVerification, IdentityKind } from '../../../lib/portone'

// 가입 전 확인용: 인증이 실제로 완료됐고 아직 사용 가능한지만 확인 (저장 안 함)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const kind = body?.kind as IdentityKind
  const verificationId = String(body?.identityVerificationId ?? '')
  if ((kind !== 'participant' && kind !== 'client') || !verificationId) {
    return NextResponse.json({ error: '요청이 올바르지 않아요.' }, { status: 400 })
  }
  const check = await precheckVerification(kind, verificationId)
  if (!check.ok) return NextResponse.json({ ok: false, message: check.message, code: check.code }, { status: 409 })
  const n = check.identity.name ?? ''
  const maskedName = n.length <= 1 ? n : n[0] + '*'.repeat(n.length - 1)
  return NextResponse.json({ ok: true, maskedName, name: check.identity.name, phone: check.identity.phone })
}
