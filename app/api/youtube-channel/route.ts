import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')
  
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })

  const cleanHandle = handle.replace('@', '')
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?forHandle=${cleanHandle}&part=statistics,snippet&key=${apiKey}`
  )

  const data = await response.json()
  const stats = data.items?.[0]?.statistics
  const snippet = data.items?.[0]?.snippet

  return NextResponse.json({
    subscriberCount: Number(stats?.subscriberCount ?? 0),
    videoCount: Number(stats?.videoCount ?? 0),
    thumbnail: snippet?.thumbnails?.default?.url ?? null
  })
}