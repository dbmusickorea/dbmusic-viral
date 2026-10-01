import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const now = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const currentHour = kstNow.getUTCHours()

    // 체험단 팔로워 수 갱신 (하루 1회)
    if (currentHour === 3) {
      const { data: allParticipantsForFollowers } = await supabase
        .from('participants')
        .select('id, instagram_id, youtube_id, tiktok_id')
        .eq('is_locked', false)

      if (allParticipantsForFollowers) {
        for (const p of allParticipantsForFollowers) {
          try {
            if (p.instagram_id) {
              const igRes = await fetch(`https://app.doubleb.kr/api/instagram-user?username=${p.instagram_id}`)
              const igData = await igRes.json()
              if (igData.followers !== undefined && igData.followers > 0) {
                await supabase.from('participants').update({ instagram_followers: igData.followers, instagram_profile_image: igData.thumbnail ?? undefined, instagram_is_private: igData.isPrivate ?? false }).eq('id', p.id)
              }
            }
            if (p.youtube_id) {
              const ytRes = await fetch(`https://app.doubleb.kr/api/youtube-channel?handle=${p.youtube_id}`)
              const ytData = await ytRes.json()
              if (ytData.subscriberCount !== undefined && ytData.subscriberCount > 0) {
                await supabase.from('participants').update({ youtube_subscribers: ytData.subscriberCount, youtube_profile_image: ytData.thumbnail ?? undefined }).eq('id', p.id)
              }
            }
            if (p.tiktok_id) {
              const ttRes = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${p.tiktok_id.replace('@','')}`, {
                headers: {
                  'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
                  'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
                }
              })
              const ttData = await ttRes.json()
              if (ttData?.data?.stats?.followerCount !== undefined && ttData.data.stats.followerCount > 0) {
                await supabase.from('participants').update({ tiktok_followers: ttData.data.stats.followerCount, tiktok_profile_image: ttData.data?.user?.avatarLarger ?? undefined, tiktok_is_private: ttData.data?.user?.privateAccount ?? false }).eq('id', p.id)
              }
            }
          } catch { continue }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
