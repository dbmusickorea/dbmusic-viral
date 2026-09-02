import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'file 필요' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'bin'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabaseAdmin.storage
    .from('chat-attachments')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('chat-attachments').getPublicUrl(path)

  return NextResponse.json({ success: true, url: urlData.publicUrl, name: file.name, type: file.type })
}
