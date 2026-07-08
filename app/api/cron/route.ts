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

    // 날짜별 자동 푸시 알림
    const today = new Date().toISOString().split('T')[0]
    
    // 모집 시작일 푸시 (mission_date가 오늘인 프로젝트)
    const { data: recruitProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('mission_date', today)
      .eq('status', 'ONGOING')
    
    if (recruitProjects && recruitProjects.length > 0) {
      const { data: participantTokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_role', 'participant')
      
      if (participantTokens && participantTokens.length > 0) {
        for (const project of recruitProjects) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app')}/api/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '🎵 모집이 시작됐어요!',
              body: `${project.product_content} 프로젝트 모집이 시작됐어요! 지금 참여하세요!`,
              tokens: participantTokens.map((t: any) => t.token)
            })
          })
        }
      }
    }

    // 미션 수행일 푸시 (start_date가 오늘인 프로젝트)
    const { data: missionProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('start_date', today)
      .eq('status', 'ONGOING')
    
    if (missionProjects && missionProjects.length > 0) {
      for (const project of missionProjects) {
        const { data: joinedTokens } = await supabase
          .from('project_participants')
          .select('member_id')
          .ilike('project_code', project.project_code)
        
        if (joinedTokens && joinedTokens.length > 0) {
          const memberIds = joinedTokens.map((j: any) => String(j.member_id))
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .in('user_id', memberIds)
          
          if (tokens && tokens.length > 0) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '📅 미션이 시작됐어요!',
                body: `${project.product_content} 미션이 시작됐어요! 24시간 안에 게시물을 올려주세요.`,
                tokens: tokens.map((t: any) => t.token)
              })
            })
          }
        }
      }
    }

    // 미션 불이행 체크
    const now = new Date()
    const { data: missionDayProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('start_date', today)
      .eq('status', 'ONGOING')

    if (missionDayProjects && missionDayProjects.length > 0) {
      for (const project of missionDayProjects) {
        if (!project.mission_time) continue
        
        const missionDateTime = new Date(`${today}T${project.mission_time}:00`)
        const twentyFourHoursAfter = new Date(missionDateTime.getTime() + 24 * 60 * 60 * 1000)

        if (now < twentyFourHoursAfter) continue

        // 참여자 목록
        const { data: joinedParticipants } = await supabase
          .from('project_participants')
          .select('member_id')
          .ilike('project_code', project.project_code)

        if (!joinedParticipants) continue

        for (const jp of joinedParticipants) {
          // 미션 제출 여부 확인
          const { data: post } = await supabase
            .from('posts')
            .select('id')
            .ilike('project_code', project.project_code)
            .eq('member_id', jp.member_id)
            .maybeSingle()

          if (!post) {
            // 미션 미제출 → 벌칙 적용
            const { data: participant } = await supabase
              .from('participants')
              .select('id, level')
              .eq('id', jp.member_id)
              .maybeSingle()

            if (participant) {
              const newLevel = Math.max(1, (participant.level ?? 1) - 10)
              const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              await supabase.from('participants').update({
                level: newLevel,
                banned_until: bannedUntil.toISOString()
              }).eq('id', participant.id)
              
              // 참여자 상태 BANNED로 변경
              await supabase.from('project_participants').update({
                status: 'BANNED'
              }).ilike('project_code', project.project_code).eq('member_id', participant.id)
              
              // 추가모집 푸시 발송
              const { data: allTokens } = await supabase
                .from('push_tokens')
                .select('token')
                .eq('user_role', 'participant')
              
              if (allTokens && allTokens.length > 0) {
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '🔔 추가 모집 공고!',
                    body: `${project.product_content} 프로젝트 공석이 생겼어요! 지금 참여하세요!`,
                    tokens: allTokens.map((t: any) => t.token)
                  })
                })
              }
            }
          }
        }
      }
    }

    // 1개월 미활동 락 체크
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('id')
      .eq('is_locked', false)
    
    if (allParticipants) {
      for (const p of allParticipants) {
        const { data: recentPost } = await supabase
          .from('posts')
          .select('id')
          .eq('member_id', p.id)
          .gte('created_at', oneMonthAgo.toISOString())
          .maybeSingle()
        
        if (!recentPost) {
          // 1개월 미활동 → 락
          await supabase.from('participants').update({ is_locked: true }).eq('id', p.id)
          
          // 락 푸시 알림
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', String(p.id))
          
          if (tokens && tokens.length > 0) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '⚠️ 활동 잠금 알림',
                body: '1개월간 미션 참여가 없어서 계정이 잠겼어요. 유튜브 댓글 10회 작성으로 잠금을 해제하세요!',
                tokens: tokens.map((t: any) => t.token)
              })
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}