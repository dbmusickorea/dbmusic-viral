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

  // 유튜브는 서버(클라우드 IP)로 접속하면 봇으로 인식해서 정보를 안 주는 경우가 많아,
  // 유튜브가 공식 제공하는 oEmbed API를 대신 사용
  if (/(?:youtube\.com|youtu\.be)/.test(url)) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: AbortSignal.timeout(5000),
      })
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json()
        return NextResponse.json({
          title: oembedData.title,
          description: null,
          image: oembedData.thumbnail_url,
          siteName: 'YouTube',
          url,
        })
      }
    } catch (e) {
      console.error('link-preview 유튜브 oEmbed 실패:', e)
    }
  }

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

    console.log('link-preview 요청:', url, 'HTTP상태:', res.status, 'title:', title, 'image:', image)

    if (!title) {
      console.log('link-preview title 못찾음, html 앞부분:', html.slice(0, 500))
      return NextResponse.json({ error: 'no preview' }, { status: 404 })
    }

    return NextResponse.json({ title, description, image, siteName, url })
  } catch (e) {
    console.error('link-preview 자체 실패:', e)
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
