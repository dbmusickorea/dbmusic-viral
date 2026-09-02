import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')

  let query = supabaseAdmin.from('distribution_release_requests').select('*').order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { error, data } = await supabaseAdmin.from('distribution_release_requests').insert(body).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await request.json()
  const { error } = await supabaseAdmin.from('distribution_release_requests').update(body).eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })

  // 승인 시 앨범(+참여 아티스트) 자동 생성 (뼈대 단계 - 나중에 관리자가 상세 보완)
  if (body.status === 'APPROVED') {
    const { data: reqRow } = await supabaseAdmin.from('distribution_release_requests').select('*').eq('id', id).single()
    if (reqRow && !reqRow.created_album_id) {
      const { data: album } = await supabaseAdmin.from('distribution_albums').insert({
        client_id: reqRow.client_id,
        album_name: reqRow.album_name,
        release_date: reqRow.release_desired_date,
      }).select().single()

      if (album) {
        const artistNames = (reqRow.participating_artists ?? '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)

        for (const raw of artistNames) {
          const isFeaturing = raw.startsWith('(피처링)')
          const name = raw.replace('(피처링)', '').trim()
          const { data: artist } = await supabaseAdmin.from('distribution_artists').insert({
            client_id: reqRow.client_id,
            name,
            streaming_url: !isFeaturing ? reqRow.artist_streaming_url : null,
          }).select().single()

          if (artist) {
            await supabaseAdmin.from('distribution_album_artists').insert({
              album_id: album.id,
              artist_id: artist.id,
              role: isFeaturing ? 'featuring' : 'main',
            })
          }
        }

        await supabaseAdmin.from('distribution_release_requests').update({ created_album_id: album.id }).eq('id', id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
