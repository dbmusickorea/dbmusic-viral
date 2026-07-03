import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 })
  }

  // 틱톡 URL에서 video_id 추출
  const videoId = url.match(/video\/(\d+)/)?.[1]

  if (!videoId) {
    return NextResponse.json({ error: 'invalid tiktok url' }, { status: 400 })
  }

  const response = await fetch(
    `https://tiktok-scraper7.p.rapidapi.com/video/info?url=${encodeURIComponent(url)}`,
    {
      headers: {
        'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    }
  )

  const data = await response.json()
  
  return NextResponse.json({
    likes: data.data?.digg_count ?? 0,
    comments: data.data?.comment_count ?? 0,
    views: data.data?.play_count ?? 0
  })
}