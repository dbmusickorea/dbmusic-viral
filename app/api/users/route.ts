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

// 요청자의 users 행 (auth_id 우선, auth_id가 비어있는 행만 이메일로 보조 매칭)
async function getMe(authUserId: string, email: string | undefined) {
  const byAuth = await supabaseAdmin.from('users').select('id, role').eq('auth_id', authUserId).maybeSingle()
  if (byAuth.data) return byAuth.data as { id: number; role: string | null }
  if (email) {
    const byEmail = await supabaseAdmin.from('users').select('id, role').eq('email', email).is('auth_id', null).maybeSingle()
    if (byEmail.data) return byEmail.data as { id: number; role: string | null }
  }
  return null
}

// 수정/삭제 대상 한 명 찾기 (id → client_id → email 순)
async function findTarget(params: URLSearchParams) {
  const id = params.get('id')
  const clientId = params.get('client_id')
  const email = params.get('email')
  let q = supabaseAdmin.from('users').select('id, role, email, auth_id, dist_info_locked')
  if (id) q = q.eq('id', id)
  else if (clientId) q = q.eq('client_id', clientId)
  else if (email) q = q.eq('email', email)
  else return null
  const { data } = await q.limit(2)
  if (!data || data.length !== 1) return null
  return data[0] as { id: number; role: string | null; email: string | null; auth_id: string | null; dist_info_locked: boolean | null }
}

// 일반 사용자가 직접 바꿀 수 없는 필드 (관리자만 가능)
const PROTECTED_FIELDS = [
  'id', 'role', 'auth_id', 'client_id', 'created_at',
  'distribution_balance', 'has_distribution', 'distribution_only',
  'is_deleted', 'deleted_at',
  'dist_info_locked', 'dist_info_submitted_at',
]

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const clientId = searchParams.get('client_id')
  const mobile = searchParams.get('mobile')
  const role = searchParams.get('role')
  const id = searchParams.get('id')

  // 관리자가 아닌 사용자가 관리자 목록을 요청하면 id만 돌려줌 (알림 대상 계산용, 이름/연락처 등은 노출하지 않음)
  if (role === 'admin' && !email && !clientId && !mobile && !id) {
    const me = await getMe(auth.user.id, auth.user.email)
    if (me?.role !== 'admin') {
      const { data: adminIds } = await supabaseAdmin.from('users').select('id').eq('role', 'admin')
      return NextResponse.json(adminIds ?? [])
    }
  }

  let query = auth.client.from('users').select('*')

  if (email) query = query.eq('email', email)
  else if (clientId) query = query.eq('client_id', clientId)
  else if (mobile) query = query.eq('mobile', mobile)
  else if (role) query = query.eq('role', role)
  else if (id) query = query.eq('id', id)
  else query = query.eq('role', 'client').order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getMe(auth.user.id, auth.user.email)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const isAdmin = me.role === 'admin'

  const target = await findTarget(new URL(request.url).searchParams)
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isAdmin && target.id !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  delete body.id
  if (!isAdmin) for (const k of PROTECTED_FIELDS) delete body[k]

  // 유통정보/세금정보/지급정보(dist_*) 필드 - 한 번 저장되면 잠금, 관리자만 수정 가능
  const distFields = Object.keys(body).filter(k => k.startsWith('dist_') && k !== 'dist_info_locked' && k !== 'dist_info_submitted_at')
  if (distFields.length > 0) {
    if (target.dist_info_locked) {
      if (!isAdmin) {
        return NextResponse.json({ error: '이미 등록된 유통/세금/지급 정보는 수정할 수 없어요. 변경이 필요하면 고객센터로 문의해주세요.' }, { status: 403 })
      }
    } else {
      body.dist_info_locked = true
      body.dist_info_submitted_at = new Date().toISOString()
    }
  }

  // 이메일 변경 시 Supabase Auth(실제 로그인 계정)도 동기화 (권한 확인 이후)
  if (body.email && target.auth_id && target.email !== body.email) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
      email: body.email,
      email_confirm: true
    })
    if (authUpdateError) {
      return NextResponse.json({ error: `인증 이메일 수정 실패: ${authUpdateError.message}` }, { status: 500 })
    }
  }

  const { error } = await supabaseAdmin.from('users').update(body).eq('id', target.id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getMe(auth.user.id, auth.user.email)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  if (me.role !== 'admin' && String(me.id) !== String(id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 완전 삭제 대신 비활성화 처리 (법적 5년 보관 의무)
  const { error } = await supabaseAdmin.from('users').update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    name: '탈퇴한 사용자',
    phone: null,
    mobile: null,
  }).eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

const SIGNUP_FIELDS = ['name', 'company', 'artist', 'phone', 'mobile', 'email', 'client_id', 'agreed_terms', 'download_source']

export async function POST(request: NextRequest) {
  // 회원가입은 로그인 전에도 호출될 수 있어 인증은 요구하지 않되, 허용 필드만 받고 role은 서버에서 고정
  const body = await request.json()
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const row: any = {}
  for (const k of SIGNUP_FIELDS) if (body[k] !== undefined) row[k] = body[k]
  row.role = 'client'
  if (!row.email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data: dup } = await supabaseAdmin.from('users').select('id').eq('email', row.email).or('is_deleted.is.null,is_deleted.eq.false').limit(1)
  if (dup && dup.length > 0) return NextResponse.json({ error: 'already exists' }, { status: 409 })

  // 본인인증 검증 (REQUIRE_IDENTITY=true 이면 필수)
  const verificationId = typeof body.identityVerificationId === 'string' ? body.identityVerificationId : ''
  let identity: any = null
  if (verificationId) {
    const check = await precheckVerification('client', verificationId)
    if (!check.ok) return NextResponse.json({ error: check.message, code: check.code }, { status: 409 })
    identity = check.identity
  } else if (process.env.REQUIRE_IDENTITY === 'true') {
    return NextResponse.json({ error: '본인인증이 필요해요.', code: 'NOT_VERIFIED' }, { status: 400 })
  }

  const { data: created, error } = await supabaseAdmin.from('users').insert(row).select('id').single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  if (identity && created) {
    try {
      await recordVerification('client', verificationId, Number(created.id), identity)
    } catch (e) {
      console.error('본인인증 기록 실패:', e)
    }
  }
  return NextResponse.json({ success: true })
}
