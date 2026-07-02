import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const shortcode = request.nextUrl.searchParams.get('shortcode')
  
  if (!shortcode) {
    return NextResponse.json({ error: 'shortcode required' }, { status: 400 })
  }

  const response = await fetch(
    `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
    {
      headers: {
        'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
        'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com'
      }
    }
  )

  const data = await response.json()
  return NextResponse.json(data)
}