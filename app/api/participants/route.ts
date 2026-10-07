import { getChatIdentity } from '../../lib/chatAuth'
import { precheckVerification, recordVerification } from '../../lib/portone'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return { client, user }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')
  const id = searchParams.get('id')
  const referredBy = searchParams.get('referred_by')
  const email = searchParams.get('email')
  const mobile = searchParams.get('mobile')
  const referralCode = searchParams.get('referral_code')
  const coverApproved = searchParams.get('cover_approved')

  let query = auth.client.from('participants').select('*').order('id', { ascending: false })

  if (id) query = query.eq('id', Number(id))
  else if (ids) query = query.in('id', ids.split(',').map(Number))
  else if (referredBy) query = query.eq('referred_by', referredBy)
  else query = query.eq('is_deleted', false)
  if (email) query = query.eq('email', email)
  if (mobile) query = query.eq('mobile', mobile)
  if (referralCode) query = query.eq('referral_code', referralCode)
  if (coverApproved === 'true') query = query.eq('cover_approved', true)
  if (coverApproved === 'false') query = query.eq('cover_approved', false).eq('is_cover_possible', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')
  const body = await request.json()

  // 이메일 변경 시 Supabase Auth(실제 로그인 계정)도 동기화
  if (body.email && id) {
    const { data: existing } = await supabaseAdmin.from('participants').select('auth_id, email').eq('id', id).maybeSingle()
    if (existing?.auth_id && existing.email !== body.email) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(existing.auth_id, {
        email: body.email,
        email_confirm: true
      })
      if (authUpdateError) {
        return NextResponse.json({ error: `인증 이메일 수정 실패: ${authUpdateError.message}` }, { status: 500 })
      }
    }
  }

  let query = auth.client.from('participants').update(body)
  if (id) query = query.eq('id', id)
  else if (email) query = query.eq('email', email)

  const { error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 완전 삭제 대신 비활성화 처리 (법적 5년 보관 의무)
  const { error } = await supabaseAdmin.from('participants').update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    name: '탈퇴한 사용자',
    phone: null,
    mobile: null,
    account_number: null,
    account_holder: null,
    resident_number: null,
    instagram_id: null,
    youtube_id: null,
    tiktok_id: null,
  }).eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // 회원가입은 인증 불필요, service_role 사용
  const raw = await request.json()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  let isAdmin = false
  try {
    const me: any = await getChatIdentity(request)
    isAdmin = !!me?.isAdmin
  } catch {}

  // 관리자는 기존처럼 전체 필드 허용, 그 외(회원가입/전환)는 허용 필드만 받음 (잔액/레벨/인증표시 조작 방지)
  const SIGNUP_FIELDS = [
    'name', 'mobile', 'email', 'bank_name', 'bank_code', 'account_holder', 'account_number',
    'instagram_id', 'youtube_id', 'tiktok_id',
    'instagram_followers', 'youtube_subscribers', 'tiktok_followers',
    'instagram_profile_image', 'youtube_profile_image', 'tiktok_profile_image',
    'instagram_is_private', 'tiktok_is_private',
    'referral_code', 'referred_by', 'is_cover_possible', 'cover_video_url',
    'genres', 'agreed_terms', 'download_source',
  ]
  const body: any = {}
  if (isAdmin) {
    Object.assign(body, raw)
  } else {
    for (const k of SIGNUP_FIELDS) if (raw[k] !== undefined) body[k] = raw[k]
    body.level = 1
  }
  delete body.password
  delete body.identityVerificationId
  body.is_verified = false

  // 본인인증 검증 (REQUIRE_IDENTITY=true 이면 필수)
  const verificationId = typeof raw.identityVerificationId === 'string' ? raw.identityVerificationId : ''
  let identity: any = null
  if (!isAdmin) {
    if (verificationId) {
      const check = await precheckVerification('participant', verificationId)
      if (!check.ok) return NextResponse.json({ error: check.message, code: check.code }, { status: 409 })
      identity = check.identity
    } else if (process.env.REQUIRE_IDENTITY === 'true') {
      return NextResponse.json({ error: '본인인증이 필요해요.', code: 'NOT_VERIFIED' }, { status: 400 })
    }
  }

  const { data: created, error } = await supabaseAdmin.from('participants').insert(body).select('id').single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  if (identity && created) {
    try {
      await recordVerification('participant', verificationId, Number(created.id), identity)
    } catch (e) {
      console.error('본인인증 기록 실패:', e)
    }
  }

  // 추천인 보상 처리 (인증 없는 가입 시점이라 서버(service_role)에서 안전하게 처리)
  if (body.referred_by) {
    try {
      const { data: referrer } = await supabaseAdmin.from('participants').select('id, balance, level').eq('referral_code', body.referred_by).maybeSingle()
      if (referrer) {
        const newBalance = (referrer.balance ?? 0) + 150
        const newLevel = Math.min(50, (referrer.level ?? 1) + 1)
        await supabaseAdmin.from('participants').update({ balance: newBalance, level: newLevel }).eq('id', referrer.id)
        await supabaseAdmin.from('point_history').insert({ member_id: referrer.id, amount: 150, memo: `친구추천 보상 (${body.name})` })

        const { data: referrerTokens } = await supabaseAdmin.from('push_tokens').select('token, user_id').eq('user_id', String(referrer.id))
        if (referrerTokens && referrerTokens.length > 0) {
          await fetch('https://app.doubleb.kr/api/push', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎉 레벨이 올랐어요!',
              body: `추천인 보상으로 Lv.${newLevel}이 됐어요! 150P도 적립됐어요.`,
              tokens: referrerTokens.map((t: any) => t.token),
              userIds: referrerTokens.map((t: any) => t.user_id)
            })
          })
        }
      }
    } catch (e) {
      console.error('추천인 보상 처리 실패:', e)
    }
  }

  return NextResponse.json({ success: true })
}
