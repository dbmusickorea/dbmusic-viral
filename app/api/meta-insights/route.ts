import { NextRequest, NextResponse } from 'next/server'

const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  const cacheKey = `meta_${campaignId ?? 'all'}`
  const now = Date.now()

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return NextResponse.json({ ...cache[cacheKey].data, cached: true })
  }

  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN 없음' }, { status: 500 })

  const adAccountId = '972743702202669'
  let url: string
  let params: URLSearchParams

  if (campaignId) {
    // 캠페인별 성과
    url = `https://graph.facebook.com/v19.0/${campaignId}/insights`
    params = new URLSearchParams({
      fields: 'spend,impressions,inline_link_clicks',
      date_preset: 'today',
      access_token: token,
    })
  } else {
    // 전체 광고 계정 성과
    url = `https://graph.facebook.com/v19.0/act_${adAccountId}/insights`
    params = new URLSearchParams({
      fields: 'spend,impressions,inline_link_clicks',
      date_preset: 'today',
      access_token: token,
    })
  }

  try {
    const res = await fetch(`${url}?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (json.error) return NextResponse.json({ error: json.error.message }, { status: 502 })

    const raw = json.data?.[0] ?? {}
    const result = {
      spend: raw.spend ?? '0',
      impressions: raw.impressions ?? '0',
      inline_link_clicks: raw.inline_link_clicks ?? '0',
      fetched_at: new Date().toISOString(),
    }

    cache[cacheKey] = { data: result, timestamp: now }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: '메타 API 호출 실패' }, { status: 503 })
  }
}
