import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get('platform')
  const audioId = request.nextUrl.searchParams.get('audio_id')
  
  if (!platform || !audioId) return NextResponse.json({ count: 0 })

  try {
    if (platform === 'tiktok') {
      const res = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/music/details?clipId=${audioId}`, {
        headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
      })
      const data = await res.json()
      return NextResponse.json({ count: data?.data?.music_info?.user_count ?? 0 })
    }
    
    if (platform === 'instagram') {
      const res = await fetch(`https://api.sociavault.com/v1/scrape/instagram/reels-by-song?audio_id=${audioId}`, {
        headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
      })
      const data = await res.json()
      const items = data?.items ?? {}
      return NextResponse.json({ count: Object.keys(items).length })
    }
  } catch {
    return NextResponse.json({ count: 0 })
  }
  
  return NextResponse.json({ count: 0 })
}