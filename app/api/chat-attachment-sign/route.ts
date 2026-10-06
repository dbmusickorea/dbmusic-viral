import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getChatIdentity } from '../../lib/chatAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const me = await getChatIdentity(request)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!me.isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const rawExt = (body.file_name?.split('.').pop() || 'bin')
  const ext = String(rawExt).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabaseAdmin.storage
    .from('chat-attachments')
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('chat-attachments').getPublicUrl(path)

  return NextResponse.json({ path, token: data.token, publicUrl: urlData.publicUrl })
}
