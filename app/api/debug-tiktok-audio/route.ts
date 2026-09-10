import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const projectCode = req.nextUrl.searchParams.get('project_code')
  if (!projectCode) return NextResponse.json({ error: 'project_code required' }, { status: 400 })

  const { data: project } = await supabase.from('projects').select('project_code, tiktok_audio_id').eq('project_code', projectCode).maybeSingle()
  if (!project) return NextResponse.json({ error: 'project not found' }, { status: 404 })
  if (!project.tiktok_audio_id) return NextResponse.json({ error: 'tiktok_audio_id 없음' }, { status: 400 })

  const tiktokId = project.tiktok_audio_id.match(/(\d{10,})/)?.[1] ?? project.tiktok_audio_id

  try {
    const res = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/music/videos?clipId=${tiktokId}`, {
      headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
    })
    const status = res.status
    const data = await res.json()
    const videos = data?.data?.aweme_list ?? {}
    const count = Object.keys(videos).length

    await supabase.from('projects').update({ tiktok_audio_count: count }).eq('project_code', projectCode)

    return NextResponse.json({
      project_code: projectCode,
      raw_tiktok_audio_id: project.tiktok_audio_id,
      extracted_clipId: tiktokId,
      http_status: status,
      computed_count: count,
      updated_in_db: true,
      raw_response: data
    })
  } catch (e: any) {
    return NextResponse.json({ error: '호출 실패', detail: String(e) }, { status: 500 })
  }
}
