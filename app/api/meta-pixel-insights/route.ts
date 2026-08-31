import { NextRequest, NextResponse } from 'next/server'

let cached: { data: any; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000
const CLIENT_AD_CAMPAIGN_ID = '120256554001520715' // 의뢰인용 광고 캠페인

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forceRefresh = searchParams.get('refresh') === '1'
  const now = Date.now()

  if (!forceRefresh && cached.data && now - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true })
  }

  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN 없음' }, { status: 500 })

  const params = new URLSearchParams({
    fields: 'actions',
    date_preset: 'last_30d',
    access_token: token,
  })

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${CLIENT_AD_CAMPAIGN_ID}/insights?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (json.error) return NextResponse.json({ error: json.error.message }, { status: 502 })

    const actions = json.data?.[0]?.actions ?? []
    const pageViews = Number(actions.find((a: any) => a.action_type === 'landing_page_view')?.value ?? 0)

    const result = {
      campaign_id: CLIENT_AD_CAMPAIGN_ID,
      period_days: 30,
      page_views: pageViews,
      fetched_at: new Date().toISOString(),
    }

    cached = { data: result, timestamp: now }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: '메타 API 호출 실패' }, { status: 503 })
  }
}
