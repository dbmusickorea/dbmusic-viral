import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const cleanUsername = username.replace('@', '')

  const response = await fetch(
    `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/user?username=${cleanUsername}`,
    {
      headers: {
        'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
        'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com'
      }
    }
  )

  const data = await response.json()
  return NextResponse.json({
    followers: data?.data?.user?.edge_followed_by?.count ?? data?.followers_count ?? 0,
    posts: data?.data?.user?.edge_owner_to_timeline_media?.count ?? data?.media_count ?? 0
  })
}