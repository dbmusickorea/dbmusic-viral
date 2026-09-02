import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const artistId = formData.get('artist_id') as string | null

  if (!file || !artistId) {
    return NextResponse.json({ error: 'file, artist_id 필요' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${artistId}/profile.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabaseAdmin.storage
    .from('distribution-artist-profiles')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('distribution-artist-profiles').getPublicUrl(path)
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabaseAdmin
    .from('distribution_artists')
    .update({ profile_image_url: publicUrl })
    .eq('id', artistId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, url: publicUrl })
}
