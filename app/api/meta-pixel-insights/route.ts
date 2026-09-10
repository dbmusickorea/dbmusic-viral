import { NextRequest, NextResponse } from 'next/server'

const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 5 * 60 * 1000
const CAMPAIGN_IDS: Record<string, string> = {
  client: '120256554001520715',      // 의뢰인용 광고 캠페인
  participant: '120256722749830715', // 체험단용 광고 캠페인
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const forceRefresh = searchParams.get('refresh') === '1'
  const target = searchParams.get('target') === 'participant' ? 'participant' : 'client'
  const campaignId = CAMPAIGN_IDS[target]
  const now = Date.now()

  if (!forceRefresh && cache[target]?.data && now - cache[target].timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cache[target].data, cached: true })
  }

  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN 없음' }, { status: 500 })

  const params = new URLSearchParams({
    fields: 'actions',
    date_preset: 'last_30d',
    access_token: token,
  })

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${campaignId}/insights?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (json.error) return NextResponse.json({ error: json.error.message }, { status: 502 })

    const actions = json.data?.[0]?.actions ?? []
    const pageViews = Number(actions.find((a: any) => a.action_type === 'landing_page_view')?.value ?? 0)

    const result = {
      campaign_id: campaignId,
      period_days: 30,
      page_views: pageViews,
      fetched_at: new Date().toISOString(),
    }

    cache[target] = { data: result, timestamp: now }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: '메타 API 호출 실패' }, { status: 503 })
  }
}
