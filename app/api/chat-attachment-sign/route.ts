import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.json()
  const ext = (body.file_name?.split('.').pop() || 'bin')
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabaseAdmin.storage
    .from('chat-attachments')
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('chat-attachments').getPublicUrl(path)

  return NextResponse.json({ path, token: data.token, publicUrl: urlData.publicUrl })
}
