import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { application_id, project_code } = await request.json()
  if (!application_id || !project_code) {
    return NextResponse.json({ error: 'application_id, project_code 필요' }, { status: 400 })
  }

  const { data: application } = await supabaseAdmin
    .from('project_applications')
    .select('cover_audio_path, cover_mr_path')
    .eq('id', application_id)
    .maybeSingle()

  if (!application) return NextResponse.json({ error: '신청서를 찾을 수 없어요' }, { status: 404 })

  const updates: any = {}

  for (const [col, path] of [['cover_audio_path', application.cover_audio_path], ['cover_mr_path', application.cover_mr_path]]) {
    if (!path) continue
    const ext = (path as string).split('.').pop()
    const type = col === 'cover_mr_path' ? 'mr' : 'audio'
    const newPath = `${project_code}/${type}.${ext}`

    const { error: copyError } = await supabaseAdmin.storage
      .from('cover-audio')
      .copy(path as string, newPath)

    if (!copyError) {
      updates[col] = newPath
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('projects').update(updates).eq('project_code', project_code)
  }

  return NextResponse.json({ success: true, migrated: Object.keys(updates) })
}
