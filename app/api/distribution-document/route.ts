import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChatIdentity } from '../../lib/chatAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'distribution-documents'
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf']

// 본인(해당 user_id의 의뢰인) 또는 관리자만 접근 가능
function canAccess(me: any, userId: string) {
  return !!me && (me.isAdmin || (me.clientId != null && String(me.clientId) === String(userId)))
}

// 업로드용 서명 주소 발급
export async function POST(request: NextRequest) {
  const me = await getChatIdentity(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const userId = String(body?.user_id ?? '')
  if (!/^\d+$/.test(userId)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  if (!canAccess(me, userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rawExt = String(body?.filename ?? '').split('.').pop() ?? ''
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ error: '이미지 또는 PDF 파일만 올릴 수 있어요.' }, { status: 400 })
  }

  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: 'sign failed' }, { status: 500 })
  return NextResponse.json({ path, token: data.token })
}

// 열람용 서명 주소 발급 (5분)
export async function GET(request: NextRequest) {
  const me = await getChatIdentity(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = new URL(request.url).searchParams.get('path') ?? ''
  const userId = path.split('/')[0]
  if (!path || path.includes('..') || !/^\d+$/.test(userId)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (!canAccess(me, userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 300)
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ url: data.signedUrl })
}
