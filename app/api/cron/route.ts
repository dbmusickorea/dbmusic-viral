import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: posts } = await supabase.from('posts').select('*')
    if (!posts) return NextResponse.json({ success: false })

    let updated = 0

    for (const post of posts) {
      try {
        let likes = 0
        let comments = 0

        if (post.platform === 'instagram') {
          const shortcode = post.post_url.split('/p/')[1]?.split('/')[0]
          if (!shortcode) continue
          const res = await fetch(
            `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
            {
              headers: {
                'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
                'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com'
              }
            }
          )
          const data = await res.json()
          likes = data.like_count ?? 0
          comments = data.comment_count ?? 0
          await new Promise(resolve => setTimeout(resolve, 1000))

        } else if (post.platform === 'youtube') {
          const videoId = post.post_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
          if (!videoId) continue
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
          )
          const data = await res.json()
          const stats = data.items?.[0]?.statistics
          likes = Number(stats?.likeCount ?? 0)
          comments = Number(stats?.commentCount ?? 0)

        } else if (post.platform === 'tiktok') {
          const res = await fetch(
            `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(post.post_url)}&hd=1`,
            {
              headers: {
                'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
                'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
              }
            }
          )
          const data = await res.json()
          likes = data.data?.digg_count ?? 0
          comments = data.data?.comment_count ?? 0
        }

        await supabase.from('posts').update({
          likes_count: likes,
          comments_count: comments
        }).eq('id', post.id)

        updated++
      } catch { continue }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}