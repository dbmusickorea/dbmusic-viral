import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  // 유튜브 URL에서 비디오 ID 추출
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
  
  if (!videoId) {
    return NextResponse.json({ error: 'invalid youtube url' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${apiKey}`
  )

  const data = await response.json()
  const stats = data.items?.[0]?.statistics

  return NextResponse.json({
    likes: Number(stats?.likeCount ?? 0),
    comments: Number(stats?.commentCount ?? 0),
    views: Number(stats?.viewCount ?? 0)
  })
}