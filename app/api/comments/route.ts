import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  const handle = request.nextUrl.searchParams.get('handle')

  if (!videoId || !handle) {
    return NextResponse.json({ error: 'videoId and handle required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  
  // 댓글 목록 가져오기
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?videoId=${videoId}&part=snippet&maxResults=100&key=${apiKey}`
  )

  const data = await response.json()

  if (!data.items) {
    return NextResponse.json({ found: false, message: '댓글을 가져올 수 없습니다.' })
  }

  // 작성자 이름 매칭
  const normalizedHandle = handle.toLowerCase().replace('@', '')
  
  const found = data.items.some((item: any) => {
    const authorName = item.snippet.topLevelComment.snippet.authorDisplayName.toLowerCase().replace('@', '')
    return authorName.includes(normalizedHandle) || normalizedHandle.includes(authorName)
  })

  return NextResponse.json({ found, totalComments: data.items.length })
}