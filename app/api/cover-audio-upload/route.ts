import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const projectCode = formData.get('project_code') as string | null
  const applicationId = formData.get('application_id') as string | null
  const type = formData.get('type') as string // 'audio' or 'mr'

  if (!file || (!projectCode && !applicationId) || !type) {
    return NextResponse.json({ error: 'file, (project_code 또는 application_id), type 필요' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = projectCode
    ? `${projectCode}/${type}.${ext}`
    : `applications/${applicationId}/${type}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabaseAdmin.storage
    .from('cover-audio')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const column = type === 'mr' ? 'cover_mr_path' : 'cover_audio_path'
  const table = projectCode ? 'projects' : 'project_applications'
  const matchColumn = projectCode ? 'project_code' : 'id'
  const matchValue = projectCode ?? applicationId

  const { error: updateError } = await supabaseAdmin
    .from(table)
    .update({ [column]: path })
    .eq(matchColumn, matchValue!)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, path })
}
