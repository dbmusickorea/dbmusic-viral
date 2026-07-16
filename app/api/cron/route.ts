import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updatePostStats(posts: any[]) {
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
          { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com' } }
        )
        const data = await res.json()
        likes = data.like_count ?? 0
        comments = data.comment_count ?? 0
        await new Promise(resolve => setTimeout(resolve, 1000))

      } else if (post.platform === 'youtube') {
        const videoId = post.post_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
        if (!videoId) continue
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
        const data = await res.json()
        const stats = data.items?.[0]?.statistics
        likes = Number(stats?.likeCount ?? 0)
        comments = Number(stats?.commentCount ?? 0)

      } else if (post.platform === 'tiktok') {
        const res = await fetch(
          `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(post.post_url)}&hd=1`,
          { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' } }
        )
        const data = await res.json()
        likes = data.data?.digg_count ?? 0
        comments = data.data?.comment_count ?? 0
      }

      await supabase.from('posts').update({ likes_count: likes, comments_count: comments }).eq('id', post.id)
      updated++
    } catch { continue }
  }
  return updated
}

export async function GET() {
  try {
    const now = new Date()
    const currentHour = now.getUTCHours()
    const today = now.toISOString().split('T')[0]

    // refresh_interval이 있는 프로젝트 - 시간별 조건부 갱신
    const { data: intervalProjects } = await supabase
      .from('projects')
      .select('project_code, refresh_interval')
      .eq('status', 'ONGOING')
      .not('refresh_interval', 'is', null)

    if (intervalProjects && intervalProjects.length > 0) {
      for (const project of intervalProjects) {
        const interval = project.refresh_interval
        if (interval && currentHour % interval === 0) {
          const { data: projectPosts } = await supabase.from('posts').select('*').ilike('project_code', project.project_code)
          if (projectPosts) await updatePostStats(projectPosts)
        }
      }
    }

    // 기본 갱신 - 낮 12시(UTC 3시)에만 실행
    let updated = 0
    if (currentHour === 3) {
      // ONGOING 프로젝트 게시물 갱신
      const { data: ongoingPosts } = await supabase.from('posts').select('*')
        .filter('project_code', 'not.in', `(${intervalProjects?.map(p => `"${p.project_code}"`).join(',') || '""'})`)
      if (ongoingPosts) updated = await updatePostStats(ongoingPosts)

      // 모니터링 연장 중인 종료 프로젝트 게시물 갱신
      const { data: monitoringProjects } = await supabase
        .from('projects')
        .select('project_code, end_date, monitoring_extension')
        .eq('status', 'COMPLETED')
        .gt('monitoring_extension', 0)

      if (monitoringProjects) {
        for (const project of monitoringProjects) {
          if (project.end_date) {
            const monitoringEndDate = new Date(new Date(project.end_date).getTime() + project.monitoring_extension * 24 * 60 * 60 * 1000)
            if (new Date() <= monitoringEndDate) {
              const { data: monitoringPosts } = await supabase.from('posts').select('*').ilike('project_code', project.project_code)
              if (monitoringPosts) await updatePostStats(monitoringPosts)
            }
          }
        }
      }
    }

    // 날짜별 자동 푸시 알림 (하루 1회 - UTC 3시)
    if (currentHour === 3) {
      // 대기중 → 진행중 자동 전환 (mission_date가 오늘인 프로젝트)
      const { data: pendingProjects } = await supabase.from('projects').select('*').eq('mission_date', today).eq('status', 'PENDING')
      if (pendingProjects && pendingProjects.length > 0) {
        for (const project of pendingProjects) {
          await supabase.from('projects').update({ status: 'ONGOING' }).eq('project_code', project.project_code)
          
          // 참여 체험단에게 진행 시작 푸시
          const { data: joinedTokens } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code)
          if (joinedTokens && joinedTokens.length > 0) {
            const memberIds = joinedTokens.map(j => String(j.member_id))
            const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', memberIds)
            if (tokens && tokens.length > 0) {
              await fetch(`https://app.doubleb.kr/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '🎵 프로젝트가 시작됐어요!',
                  body: `${project.product_content} 프로젝트가 시작됐어요! 24시간 안에 게시물을 올려주세요.`,
                  tokens: tokens.map((t: any) => t.token),
                  userIds: tokens.map((t: any) => t.user_id)
                })
              })
            }
          }
        }
      }

      // 모집 시작일 푸시
      const { data: recruitProjects } = await supabase.from('projects').select('*').eq('mission_date', today).eq('status', 'ONGOING')
      if (recruitProjects && recruitProjects.length > 0) {
        const { data: participantTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'participant')
        if (participantTokens && participantTokens.length > 0) {
          for (const project of recruitProjects) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '🎵 모집이 시작됐어요!',
                body: `${project.product_content} 프로젝트 모집이 시작됐어요! 지금 참여하세요!`,
                tokens: participantTokens.map((t: any) => t.token),
                userIds: participantTokens.map((t: any) => t.user_id)
              })
            })
          }
        }
      }

      // 미션 수행일 푸시
      const { data: missionProjects } = await supabase.from('projects').select('*').eq('start_date', today).eq('status', 'ONGOING')
      if (missionProjects && missionProjects.length > 0) {
        for (const project of missionProjects) {
          const { data: joinedTokens } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code)
          if (joinedTokens && joinedTokens.length > 0) {
            const memberIds = joinedTokens.map((j: any) => String(j.member_id))
            const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', memberIds)
            if (tokens && tokens.length > 0) {
              await fetch(`https://app.doubleb.kr/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '📅 미션이 시작됐어요!',
                  body: `${project.product_content} 미션이 시작됐어요! 24시간 안에 게시물을 올려주세요.`,
                  tokens: tokens.map((t: any) => t.token),
                  userIds: tokens.map((t: any) => t.user_id)
                })
              })
            }
          }
        }
      }

      // 미션 불이행 체크
      const { data: missionDayProjects } = await supabase.from('projects').select('*').eq('start_date', today).eq('status', 'ONGOING')
      if (missionDayProjects && missionDayProjects.length > 0) {
        for (const project of missionDayProjects) {
          if (!project.mission_time) continue
          const missionDateTime = new Date(`${today}T${project.mission_time}:00`)
          const twentyFourHoursAfter = new Date(missionDateTime.getTime() + 24 * 60 * 60 * 1000)
          if (now < twentyFourHoursAfter) continue

          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code)
          if (!joinedParticipants) continue

          for (const jp of joinedParticipants) {
            const { data: post } = await supabase.from('posts').select('id').ilike('project_code', project.project_code).eq('member_id', jp.member_id).maybeSingle()
            if (!post) {
              const { data: participant } = await supabase.from('participants').select('id, level').eq('id', jp.member_id).maybeSingle()
              if (participant) {
                const newLevel = Math.max(1, (participant.level ?? 1) - 10)
                const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                await supabase.from('participants').update({ level: newLevel, banned_until: bannedUntil.toISOString() }).eq('id', participant.id)
                await supabase.from('project_participants').update({ status: 'BANNED' }).ilike('project_code', project.project_code).eq('member_id', participant.id)
                
                // 해당 체험단에게 레벨 하락 푸시
                const { data: memberTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(participant.id))
                if (memberTokens && memberTokens.length > 0) {
                  await fetch(`https://app.doubleb.kr/api/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '⚠️ 미션 불이행으로 레벨이 하락했어요!',
                      body: `미션을 완료하지 않아 Lv.${newLevel}으로 하락했어요. 7일간 활동이 제한됩니다.`,
                      tokens: memberTokens.map((t: any) => t.token),
                      userIds: memberTokens.map((t: any) => t.user_id)
                    })
                  })
                }
                
                const { data: allTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'participant')
                if (allTokens && allTokens.length > 0) {
                  await fetch(`https://app.doubleb.kr/api/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '🔔 추가 모집 공고!',
                      body: `${project.product_content} 프로젝트 공석이 생겼어요! 지금 참여하세요!`,
                      tokens: allTokens.map((t: any) => t.token),
                      userIds: allTokens.map((t: any) => t.user_id)
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
      const { data: allParticipants } = await supabase.from('participants').select('id, created_at').eq('is_locked', false)
      if (allParticipants) {
        for (const p of allParticipants) {
          // 가입한 지 1개월 미만인 사람은 제외
          if (new Date(p.created_at) > oneMonthAgo) continue
          
          const { data: recentPost } = await supabase.from('posts').select('id').eq('member_id', p.id).gte('created_at', oneMonthAgo.toISOString()).maybeSingle()
          if (!recentPost) {
            await supabase.from('participants').update({ is_locked: true }).eq('id', p.id)
            const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(p.id))
            if (tokens && tokens.length > 0) {
              await fetch(`https://app.doubleb.kr/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '⚠️ 활동 잠금 알림',
                  body: '1개월간 미션 참여가 없어서 계정이 잠겼어요. 유튜브 댓글 10회 작성으로 잠금을 해제하세요!',
                  tokens: tokens.map((t: any) => t.token),
                  userIds: tokens.map((t: any) => t.user_id)
                })
              })
            }
          }
        }
      }

      // 미참여자 자동 푸시
      const { data: ongoingProjects } = await supabase.from('projects').select('project_code').eq('status', 'ONGOING')
      if (ongoingProjects && ongoingProjects.length > 0) {
        const { data: allParticipantsForPush } = await supabase.from('participants').select('id')
        const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').eq('status', 'ACTIVE')
        const joinedIds = new Set(joinedParticipants?.map(j => j.member_id) ?? [])
        const notJoined = allParticipantsForPush?.filter(p => !joinedIds.has(p.id)) ?? []
        if (notJoined.length > 0) {
          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', notJoined.map(p => String(p.id)))
          if (tokens && tokens.length > 0) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '🎵 새 프로젝트가 기다리고 있어요!',
                body: '아직 참여한 프로젝트가 없어요. 지금 참여해보세요!',
                tokens: tokens.map((t: any) => t.token),
                userIds: tokens.map((t: any) => t.user_id)
              })
            })
          }
        }
      }

      // 미활동자 자동 푸시
      const { data: allParticipantsInactive } = await supabase.from('participants').select('id')
      const inactive: number[] = []
      for (const p of allParticipantsInactive ?? []) {
        const { data: recentPostInactive } = await supabase.from('posts').select('id').eq('member_id', p.id).gte('created_at', oneMonthAgo.toISOString()).maybeSingle()
        const { data: currentJoin } = await supabase.from('project_participants').select('id').eq('member_id', p.id).eq('status', 'ACTIVE').maybeSingle()
        if (!recentPostInactive && !currentJoin) inactive.push(p.id)
      }
      if (inactive.length > 0) {
        const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', inactive.map(id => String(id)))
        if (tokens && tokens.length > 0) {
          await fetch(`https://app.doubleb.kr/api/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '💪 오랫동안 활동이 없었어요!',
              body: '새로운 프로젝트가 기다리고 있어요. 지금 참여해보세요!',
              tokens: tokens.map((t: any) => t.token),
              userIds: tokens.map((t: any) => t.user_id)
            })
          })
        }
      }
    }
    
    // 프로젝트별 refresh_interval에 맞게 스냅샷 저장
    const { data: ongoingProjectsForSnapshot } = await supabase
      .from('projects')
      .select('project_code, refresh_interval')
      .in('status', ['ONGOING', 'COMPLETED'])

    if (ongoingProjectsForSnapshot && ongoingProjectsForSnapshot.length > 0) {
      for (const project of ongoingProjectsForSnapshot) {
        const interval = project.refresh_interval ?? 12
        if (currentHour % interval !== 0) continue

        const { data: projectPosts } = await supabase
          .from('posts')
          .select('*')
          .ilike('project_code', project.project_code)

        if (!projectPosts) continue

        for (const post of projectPosts) {
          const snapshotKey = `${today}_${currentHour}`
          const { data: existing } = await supabase
            .from('post_stats_history')
            .select('id')
            .eq('post_id', post.id)
            .eq('recorded_at', snapshotKey)
            .maybeSingle()

          if (!existing) {
            await supabase.from('post_stats_history').insert({
              post_id: post.id,
              project_code: post.project_code,
              member_id: post.member_id,
              platform: post.platform,
              likes_count: post.likes_count ?? 0,
              comments_count: post.comments_count ?? 0,
              recorded_at: snapshotKey
            })
          }
        }
      }
    }

    // 체험단 팔로워 수 갱신
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
            if (igData.followers !== undefined) {
              await supabase.from('participants').update({ instagram_followers: igData.followers }).eq('id', p.id)
            }
          }
          if (p.youtube_id) {
            const ytRes = await fetch(`https://app.doubleb.kr/api/youtube-channel?handle=${p.youtube_id}`)
            const ytData = await ytRes.json()
            if (ytData.subscriberCount !== undefined) {
              await supabase.from('participants').update({ youtube_subscribers: ytData.subscriberCount }).eq('id', p.id)
            }
          }
          if (p.tiktok_id) {
            const ttData = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/profile?handle=${p.tiktok_id.replace('@','')}`, {
              headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
            }).then(r => r.json())
            if (ttData?.data?.stats?.followerCount !== undefined) {
              await supabase.from('participants').update({ tiktok_followers: ttData.data.stats.followerCount }).eq('id', p.id)
            }
          }
        } catch { continue }
      }
    }

    // 음원 사용량 갱신 (하루 1회)
    if (currentHour === 3) {
      const { data: projectsWithAudio } = await supabase
        .from('projects')
        .select('project_code, instagram_audio_id, tiktok_audio_id')
        .or('instagram_audio_id.not.is.null,tiktok_audio_id.not.is.null')
        .in('status', ['ONGOING', 'PAUSED'])

      if (projectsWithAudio) {
        for (const project of projectsWithAudio) {
          const updates: any = { audio_updated_at: new Date().toISOString() }
          
          if (project.instagram_audio_id) {
            try {
              const res = await fetch(`https://api.sociavault.com/v1/scrape/instagram/reels-by-song?audio_id=${project.instagram_audio_id}`, {
                headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
              })
              const data = await res.json()
              const reels = data?.data?.reels ?? {}
              updates.instagram_audio_count = Object.keys(reels).length
            } catch { }
          }

          if (project.tiktok_audio_id) {
            try {
              const res = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/music/details?clipId=${project.tiktok_audio_id}`, {
                headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
              })
              const data = await res.json()
              updates.tiktok_audio_count = data?.data?.music_info?.user_count ?? 0
            } catch { }
          }

          await supabase.from('projects').update(updates).eq('project_code', project.project_code)
        }
      }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}