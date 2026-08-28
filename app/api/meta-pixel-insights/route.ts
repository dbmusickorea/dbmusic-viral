import { NextRequest, NextResponse } from 'next/server'

let cached: { data: any; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pixelId = searchParams.get('pixel_id') ?? '2324950534579184'
  const days = Number(searchParams.get('days') ?? '30')
  const forceRefresh = searchParams.get('refresh') === '1'

  const now = Date.now()
  if (!forceRefresh && cached.data && now - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true })
  }

  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN 없음' }, { status: 500 })

  const endTime = Math.floor(now / 1000)
  const startTime = endTime - days * 24 * 60 * 60

  const params = new URLSearchParams({
    aggregation: 'event',
    start_time: String(startTime),
    end_time: String(endTime),
    access_token: token,
  })

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/stats?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (json.error) return NextResponse.json({ error: json.error.message }, { status: 502 })

    const eventBucket = json.data?.[0]?.data ?? []
    const pageViews = eventBucket.find((e: any) => e.key === 'PageView')?.value ?? 0
    const otherEvents = eventBucket.filter((e: any) => e.key !== 'PageView')

    const result = {
      pixel_id: pixelId,
      period_days: days,
      page_views: pageViews,
      other_events: otherEvents,
      fetched_at: new Date().toISOString(),
    }

    cached = { data: result, timestamp: now }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: '메타 픽셀 API 호출 실패' }, { status: 503 })
  }
}
