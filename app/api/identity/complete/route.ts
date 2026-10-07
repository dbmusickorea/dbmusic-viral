import { NextRequest, NextResponse } from 'next/server'
import { getChatIdentity } from '../../../lib/chatAuth'
import { precheckVerification, recordVerification, IdentityKind } from '../../../lib/portone'

// 로그인한 기존 회원이 본인인증을 마친 뒤 계정과 연결
export async function POST(request: NextRequest) {
  const me: any = await getChatIdentity(request)
  if (!me || !me.isMember) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const kind = body?.kind as IdentityKind
  const verificationId = String(body?.identityVerificationId ?? '')
  if ((kind !== 'participant' && kind !== 'client') || !verificationId) {
    return NextResponse.json({ error: '요청이 올바르지 않아요.' }, { status: 400 })
  }

  const refId = kind === 'participant' ? me.participantId : me.clientId
  if (!refId) return NextResponse.json({ error: '해당 계정이 아니에요.' }, { status: 403 })

  const check = await precheckVerification(kind, verificationId, Number(refId))
  if (!check.ok) return NextResponse.json({ error: check.message, code: check.code }, { status: 409 })

  try {
    await recordVerification(kind, verificationId, Number(refId), check.identity)
  } catch (e: any) {
    return NextResponse.json({ error: '저장에 실패했어요.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
