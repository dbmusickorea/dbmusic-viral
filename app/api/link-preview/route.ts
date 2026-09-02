import { NextRequest, NextResponse } from 'next/server'

const decodeEntities = (str: string) =>
  str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const getMeta = (html: string, prop: string) => {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${prop}["']`, 'i'),
  ]
  for (const re of patterns) {
    const match = html.match(re)
    if (match) return decodeEntities(match[1])
  }
  return null
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DBMusicBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const title = getMeta(html, 'og:title') || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ? decodeEntities(html.match(/<title>([^<]*)<\/title>/i)![1]) : null)
    const description = getMeta(html, 'og:description') || getMeta(html, 'description')
    let image = getMeta(html, 'og:image')
    const siteName = getMeta(html, 'og:site_name')

    // 상대경로 이미지 주소를 절대경로로 변환
    if (image && !image.startsWith('http')) {
      const base = new URL(url)
      image = new URL(image, base.origin).toString()
    }

    if (!title) return NextResponse.json({ error: 'no preview' }, { status: 404 })

    return NextResponse.json({ title, description, image, siteName, url })
  } catch (e) {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
