import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === '1'
    const now = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const currentHour = kstNow.getUTCHours()

    // 체험단 팔로워 수 갱신 (하루 1회, force=1로 수동 실행 가능)
    if (currentHour === 3 || force) {
      const { data: allParticipantsForFollowers } = await supabase
        .from('participants')
        .select('id, instagram_id, youtube_id, tiktok_id')
        .eq('is_locked', false)

      if (allParticipantsForFollowers) {
        for (const p of allParticipantsForFollowers) {
          try {
            if (p.instagram_id) {
              let igData: any = null
              for (let attempt = 0; attempt < 2 && !igData; attempt++) {
                if (attempt > 0) await new Promise(r => setTimeout(r, 1500))
                const igRes = await fetch(`https://app.doubleb.kr/api/instagram-user?username=${p.instagram_id}`)
                const json = await igRes.json()
                if (!json?.error) igData = json
              }
              if (igData && igData.followers !== undefined && igData.followers > 0) {
                await supabase.from('participants').update({ instagram_followers: igData.followers, instagram_profile_image: igData.thumbnail ?? undefined, instagram_is_private: igData.isPrivate ?? false }).eq('id', p.id)
                console.log(`[follower-refresh] IG OK id=${p.id} user=${p.instagram_id} followers=${igData.followers}`)
              } else {
                console.log(`[follower-refresh] IG SKIP id=${p.id} user=${p.instagram_id} data=${JSON.stringify(igData)}`)
              }
              await new Promise(r => setTimeout(r, 300))
            }
            if (p.youtube_id) {
              const ytRes = await fetch(`https://app.doubleb.kr/api/youtube-channel?handle=${p.youtube_id}`)
              const ytData = await ytRes.json()
              if (ytData.subscriberCount !== undefined && ytData.subscriberCount > 0) {
                await supabase.from('participants').update({ youtube_subscribers: ytData.subscriberCount, youtube_profile_image: ytData.thumbnail ?? undefined }).eq('id', p.id)
                console.log(`[follower-refresh] YT OK id=${p.id} handle=${p.youtube_id} subscribers=${ytData.subscriberCount}`)
              } else {
                console.log(`[follower-refresh] YT SKIP id=${p.id} handle=${p.youtube_id} data=${JSON.stringify(ytData)}`)
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
                console.log(`[follower-refresh] TT OK id=${p.id} handle=${p.tiktok_id} followers=${ttData.data.stats.followerCount}`)
              } else {
                console.log(`[follower-refresh] TT SKIP id=${p.id} handle=${p.tiktok_id} data=${JSON.stringify(ttData)}`)
              }
            }
          } catch (err) {
            console.log(`[follower-refresh] PARTICIPANT ERROR id=${p.id} ig=${p.instagram_id} yt=${p.youtube_id} tt=${p.tiktok_id} error=${String(err)}`)
            continue
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
