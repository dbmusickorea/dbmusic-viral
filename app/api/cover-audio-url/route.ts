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
  return user
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedClient(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const type = searchParams.get('type') // 'audio' or 'mr'
  const memberId = searchParams.get('member_id')
  const role = searchParams.get('role') // 'admin' | 'client' | 'participant'

  if (!projectCode || !type || !memberId) {
    return NextResponse.json({ error: 'project_code, type, member_id 필요' }, { status: 400 })
  }

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('cover_audio_path, cover_mr_path, start_date, artist_name, client_name, song_title')
    .ilike('project_code', projectCode)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: '프로젝트 없음' }, { status: 404 })

  const isStaff = role === 'admin' || role === 'client'

  if (type === 'audio') {
    // 원곡 미리듣기: 관리자/의뢰인은 무조건 허용, 체험단은 cover_approved만
    if (!isStaff) {
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('cover_approved')
        .eq('id', memberId)
        .maybeSingle()
      if (!participant?.cover_approved) {
        return NextResponse.json({ error: '커버 참여 자격이 없어요' }, { status: 403 })
      }
    }
    if (!project.cover_audio_path) return NextResponse.json({ error: '음원이 없어요' }, { status: 404 })

    const { data, error } = await supabaseAdmin.storage
      .from('cover-audio')
      .createSignedUrl(project.cover_audio_path, 60 * 10) // 10분 유효

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ url: data.signedUrl })
  }

  if (type === 'mr') {
    // MR 다운로드: 커버 참여 승인된 사람만 + 미션시작~15일
    const { data: participation } = await supabaseAdmin
      .from('project_participants')
      .select('is_cover, status')
      .ilike('project_code', projectCode)
      .eq('member_id', memberId)
      .eq('is_cover', true)
      .maybeSingle()

    if (!participation || participation.status !== 'ACTIVE') {
      return NextResponse.json({ error: '커버 참여 승인된 체험단만 다운로드 가능해요' }, { status: 403 })
    }

    if (project.start_date) {
      const deadline = new Date(new Date(project.start_date).getTime() + 15 * 24 * 60 * 60 * 1000)
      if (new Date() > deadline) {
        return NextResponse.json({ error: 'MR 다운로드 기한이 지났어요' }, { status: 403 })
      }
    }

    if (!project.cover_mr_path) return NextResponse.json({ error: 'MR 파일이 없어요' }, { status: 404 })

    const ext = project.cover_mr_path.split('.').pop()
    const fileName = `${projectCode}_MR.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from('cover-audio')
      .createSignedUrl(project.cover_mr_path, 60 * 10, { download: fileName })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ url: data.signedUrl })
  }

  return NextResponse.json({ error: 'type은 audio 또는 mr이어야 해요' }, { status: 400 })
}
