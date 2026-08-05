import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
  if (!user) return null
  return { user }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedClient(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const videoId = request.nextUrl.searchParams.get('videoId')
  const handle = request.nextUrl.searchParams.get('handle')

  if (!videoId || !handle) {
    return NextResponse.json({ error: 'videoId and handle required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/commentThreads?videoId=${videoId}&part=snippet&maxResults=100&key=${apiKey}`
  )

  const data = await response.json()

  if (!data.items) {
    return NextResponse.json({ found: false, message: '댓글을 가져올 수 없습니다.', error: data.error })
  }

  const normalizedHandle = handle.toLowerCase().replace('@', '')
  const foundItem = data.items.find((item: any) => {
    const authorName = item.snippet.topLevelComment.snippet.authorDisplayName.toLowerCase().replace('@', '')
    return authorName.includes(normalizedHandle) || normalizedHandle.includes(authorName)
  })

  return NextResponse.json({
    found: !!foundItem,
    totalComments: data.items.length,
    commentId: foundItem?.snippet?.topLevelComment?.id ?? null
  })
}
