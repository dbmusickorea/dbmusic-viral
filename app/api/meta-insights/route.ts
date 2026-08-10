import { NextRequest, NextResponse } from 'next/server'

const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  const cacheKey = `meta_${campaignId ?? 'all'}`
  const now = Date.now()

  const forceRefresh = searchParams.get('refresh') === '1'
  if (!forceRefresh && cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
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
      date_preset: 'maximum',
      access_token: token,
    })
  } else {
    // 전체 광고 계정 성과
    url = `https://graph.facebook.com/v19.0/act_${adAccountId}/insights`
    params = new URLSearchParams({
      fields: 'spend,impressions,inline_link_clicks',
      date_preset: 'maximum',
      access_token: token,
    })
  }

  try {
    const res = await fetch(`${url}?${params}`, { cache: 'no-store' })
    const json = await res.json()

    if (json.error) return NextResponse.json({ error: json.error.message }, { status: 502 })

    const raw = json.data?.[0] ?? {}

    // 캠페인 예산 정보 조회
    let dailyBudget = '0'
    let lifetimeBudget = '0'
    let budgetRemaining = '0'

    if (campaignId) {
      const budgetParams = new URLSearchParams({
        fields: 'daily_budget,lifetime_budget,budget_remaining',
        access_token: token,
      })
      const budgetRes = await fetch(`https://graph.facebook.com/v19.0/${campaignId}?${budgetParams}`, { cache: 'no-store' })
      const budgetJson = await budgetRes.json()
      if (!budgetJson.error) {
        dailyBudget = budgetJson.daily_budget ?? '0'
        lifetimeBudget = budgetJson.lifetime_budget ?? '0'
        budgetRemaining = budgetJson.budget_remaining ?? '0'
      }
    }

    // 전체기간 소진금액 조회
    const lifetimeParams = new URLSearchParams({
      fields: 'spend',
      date_preset: 'lifetime',
      access_token: token,
    })
    const lifetimeRes = await fetch(`${url}?${lifetimeParams}`, { cache: 'no-store' })
    const lifetimeJson = await lifetimeRes.json()
    const lifetimeSpend = lifetimeJson.data?.[0]?.spend ?? '0'

    const result = {
      spend: raw.spend ?? '0',
      lifetime_spend: lifetimeSpend !== '0' ? lifetimeSpend : String(Math.max(0, Number(lifetimeBudget) - Number(budgetRemaining))),
      impressions: raw.impressions ?? '0',
      inline_link_clicks: raw.inline_link_clicks ?? '0',
      ctr: raw.impressions && Number(raw.impressions) > 0 ? (Number(raw.inline_link_clicks ?? 0) / Number(raw.impressions) * 100).toFixed(2) : '0',
      daily_budget: dailyBudget,
      lifetime_budget: lifetimeBudget,
      budget_remaining: budgetRemaining,
      fetched_at: new Date().toISOString(),
    }

    cache[cacheKey] = { data: result, timestamp: now }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: '메타 API 호출 실패' }, { status: 503 })
  }
}
