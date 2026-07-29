import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const projectCode = request.nextUrl.searchParams.get('project_code')
  const clientId = request.nextUrl.searchParams.get('client_id')
  const participantId = request.nextUrl.searchParams.get('participant_id')

  let query = supabaseAdmin.from('cover_requests').select('*, projects(artist_name, client_name, song_title), participants(name, instagram_profile_image, youtube_profile_image, tiktok_profile_image)').order('created_at', { ascending: false })
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (clientId) query = query.eq('client_id', clientId)
  if (participantId) query = query.eq('participant_id', Number(participantId))

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { data, error } = await supabaseAdmin.from('cover_requests').insert(body).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })

  // 해당 프로젝트 의뢰인에게 푸시
  const { data: project } = await supabaseAdmin.from('projects').select('client_id, artist_name, song_title').ilike('project_code', body.project_code).maybeSingle()
  if (project?.client_id) {
    const { data: clientUser } = await supabaseAdmin.from('users').select('id').eq('client_id', project.client_id).maybeSingle()
    if (clientUser) {
      const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token, user_id').eq('user_id', String(clientUser.id))
      if (tokens && tokens.length > 0) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.doubleb.kr'}/api/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎵 커버 신청이 왔어요!',
            body: `${project.artist_name} / ${project.song_title} 커버 신청을 확인해주세요.`,
            tokens: tokens.map((t: any) => t.token),
            userIds: tokens.map((t: any) => t.user_id)
          })
        })
      }
    }
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const body = await request.json()
  const { error } = await supabaseAdmin.from('cover_requests').update(body).eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const { error } = await supabaseAdmin.from('cover_requests').delete().eq('id', Number(id))
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}