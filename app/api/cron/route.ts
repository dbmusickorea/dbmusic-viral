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
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const currentHour = kstNow.getUTCHours()
    const today = kstNow.toISOString().split('T')[0]

    // refresh_interval이 있는 프로젝트 - 시간별 조건부 갱신
    const { data: intervalProjects } = await supabase
      .from('projects')
      .select('project_code, refresh_interval, base_refresh_interval, end_date, status, cover_video_count, monitoring_extension')
      .in('status', ['ONGOING', 'COMPLETED'])
      .not('refresh_interval', 'is', null)

    if (intervalProjects && intervalProjects.length > 0) {
      for (const project of intervalProjects) {
        if (project.end_date) {
          const endDate = new Date(project.end_date)
          const monitoringDays = project.monitoring_extension ?? 0
          const monitoringEnd = new Date(endDate.getTime() + monitoringDays * 24 * 60 * 60 * 1000)
          
          // 커버 옵션 선택한 프로젝트만 추가 15일 연장
          const hasCover = (project.cover_video_count ?? 0) > 0
          const extendedEnd = hasCover 
            ? new Date(monitoringEnd.getTime() + 15 * 24 * 60 * 60 * 1000)
            : monitoringEnd

          if (new Date() > extendedEnd) continue
          
          // 커버 연장 기간이면 base 트래픽, 그 외엔 선택 트래픽
          const inCoverExtension = hasCover && new Date() > monitoringEnd
          const interval = inCoverExtension
            ? (project.base_refresh_interval ?? 12)
            : project.refresh_interval
          
          if (interval && currentHour % interval === 0) {
            const { data: projectPosts } = await supabase.from('posts').select('*').ilike('project_code', project.project_code)
            if (projectPosts) await updatePostStats(projectPosts)
          }
        } else {
          const interval = project.refresh_interval
          if (interval && currentHour % interval === 0) {
            const { data: projectPosts } = await supabase.from('posts').select('*').ilike('project_code', project.project_code)
            if (projectPosts) await updatePostStats(projectPosts)
          }
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

    // 대기중 → 진행중 자동 전환 (start_date + start_time 기준)
    const { data: pendingProjects } = await supabase.from('projects').select('*').eq('start_date', today).eq('status', 'PENDING')
    if (pendingProjects && pendingProjects.length > 0) {
      for (const project of pendingProjects) {
        if (project.start_time) {
          const startHour = parseInt(project.start_time.split(':')[0])
          if (currentHour !== startHour) continue
        }
        await supabase.from('projects').update({ status: 'ONGOING' }).eq('project_code', project.project_code)
      }
    }

    // 모집 시작일 푸시 (mission_date + mission_time 기준)
    const { data: recruitProjects } = await supabase.from('projects').select('*').eq('mission_date', today).in('status', ['ONGOING', 'PENDING'])
    if (recruitProjects && recruitProjects.length > 0) {
      const { data: participantTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'participant')
      if (participantTokens && participantTokens.length > 0) {
        for (const project of recruitProjects) {
          if (project.mission_time) {
            const missionHour = parseInt(project.mission_time.split(':')[0])
            if (currentHour !== missionHour) continue
          }
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
          // 시작시간 체크
          if (project.start_time) {
            const startHour = parseInt(project.start_time.split(':')[0])
            if (currentHour !== startHour) continue
          }
          
          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (joinedParticipants && joinedParticipants.length > 0) {
            const memberIds = joinedParticipants.map((j: any) => j.member_id)
            
            // 커버 수락자 목록
            const { data: coverApproved } = await supabase
              .from('cover_requests')
              .select('participant_id')
              .ilike('project_code', project.project_code)
              .eq('status', 'APPROVED')
            const coverIds = coverApproved?.map((c: any) => c.participant_id) ?? []
            
            // 일반 체험단 (커버 수락자 제외)
            const normalIds = memberIds.filter((id: number) => !coverIds.includes(id))
            if (normalIds.length > 0) {
              const { data: normalTokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', normalIds.map(String))
              if (normalTokens && normalTokens.length > 0) {
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '📅 미션이 시작됐어요!',
                    body: `${project.product_content} 미션이 시작됐어요! 48시간 안에 게시물을 올려주세요. ⚠️ 미업로드 시 레벨 하락 및 7일간 활동 제한됩니다.`,
                    tokens: normalTokens.map((t: any) => t.token),
                    userIds: normalTokens.map((t: any) => t.user_id)
                  })
                })
              }
            }
            
            // 커버 체험단 별도 푸시
            if (coverIds.length > 0) {
              const { data: coverTokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', coverIds.map(String))
              if (coverTokens && coverTokens.length > 0) {
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '🎵 커버영상 미션이 시작됐어요!',
                    body: `${project.product_content} 커버영상 미션이 시작됐어요! 7일 이내에 업로드해주세요.`,
                    tokens: coverTokens.map((t: any) => t.token),
                    userIds: coverTokens.map((t: any) => t.user_id)
                  })
                })
              }
            }
          }
        }
      }
      
      // 2차 게시물 푸시
      const { data: secondPostProjects } = await supabase.from('projects').select('*').eq('second_post_date', today).eq('status', 'ONGOING').eq('required_posts', 2)
      if (secondPostProjects && secondPostProjects.length > 0) {
        for (const project of secondPostProjects) {
          if (project.second_post_time) {
            const secondPostHour = parseInt(project.second_post_time.split(':')[0])
            if (currentHour !== secondPostHour) continue
          }
          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (joinedParticipants && joinedParticipants.length > 0) {
            const memberIds = joinedParticipants.map((j: any) => String(j.member_id))
            const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', memberIds)
            if (tokens && tokens.length > 0) {
              await fetch(`https://app.doubleb.kr/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '📅 2차 미션이 시작됐어요!',
                  body: `${project.product_content} 2차 게시물을 48시간 안에 올려주세요. ⚠️ 미업로드 시 레벨 하락 및 7일간 활동 제한됩니다.`,
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
          const twentyFourHoursAfter = new Date(missionDateTime.getTime() + 48 * 60 * 60 * 1000)
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
                      title: '⚠️ 미션 불이행으로 활동이 제한됐어요!',
                      body: `미션을 완료하지 않아 Lv.${newLevel}으로 하락했어요. 7일간 미션 참여가 제한됩니다.`,
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

      // 2차 게시물 미업로드 체크
      const { data: secondPostCheckProjects } = await supabase.from('projects').select('*').eq('status', 'ONGOING').eq('required_posts', 2).not('second_post_date', 'is', null)
      if (secondPostCheckProjects && secondPostCheckProjects.length > 0) {
        for (const project of secondPostCheckProjects) {
          if (!project.second_post_date || !project.second_post_time) continue
          const secondPostDateTime = new Date(`${project.second_post_date}T${project.second_post_time}:00`)
          const fortyEightHoursAfter = new Date(secondPostDateTime.getTime() + 48 * 60 * 60 * 1000)
          if (now < fortyEightHoursAfter) continue

          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (!joinedParticipants) continue

          for (const jp of joinedParticipants) {
            const { data: posts } = await supabase.from('posts').select('id').ilike('project_code', project.project_code).eq('member_id', jp.member_id)
            if (!posts || posts.length < 2) {
              const { data: participant } = await supabase.from('participants').select('*').eq('id', jp.member_id).maybeSingle()
              if (participant) {
                const newLevel = Math.max(1, (participant.level ?? 1) - 10)
                const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                await supabase.from('participants').update({ level: newLevel, banned_until: bannedUntil.toISOString() }).eq('id', participant.id)
                await supabase.from('project_participants').update({ status: 'BANNED' }).ilike('project_code', project.project_code).eq('member_id', participant.id)
                
                const { data: memberTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(participant.id))
                if (memberTokens && memberTokens.length > 0) {
                  await fetch(`https://app.doubleb.kr/api/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '⚠️ 2차 미션 불이행으로 활동이 제한됐어요!',
                      body: `2차 게시물을 올리지 않아 Lv.${newLevel}으로 하락했어요. 7일간 미션 참여가 제한됩니다.`,
                      tokens: memberTokens.map((t: any) => t.token),
                      userIds: memberTokens.map((t: any) => t.user_id)
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
        const { data: allParticipantsInactive } = await supabase.from('participants').select('id, created_at')
        const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').eq('status', 'ACTIVE')
        const joinedIds = new Set(joinedParticipants?.map(j => j.member_id) ?? [])
        const notJoined = allParticipantsInactive?.filter(p => !joinedIds.has(p.id)) ?? []
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
      const { data: allParticipantsInactive } = await supabase.from('participants').select('id, created_at')
      const inactive: number[] = []
      for (const p of allParticipantsInactive ?? []) {
        // 가입 1개월 미만 제외
        if (new Date(p.created_at) > oneMonthAgo) continue
        
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
    
    
    // 프로젝트별 refresh_interval에 맞게 스냅샷 저장
    const { data: ongoingProjectsForSnapshot } = await supabase
      .from('projects')
      .select('project_code, refresh_interval, base_refresh_interval, end_date, monitoring_extension, cover_video_count')
      .in('status', ['ONGOING', 'COMPLETED'])

    if (ongoingProjectsForSnapshot && ongoingProjectsForSnapshot.length > 0) {
      for (const project of ongoingProjectsForSnapshot) {
        // 종료일 + 모니터링 연장 + 커버 연장 계산
        if (project.end_date) {
          const endDate = new Date(project.end_date)
          const monitoringDays = project.monitoring_extension ?? 0
          const monitoringEnd = new Date(endDate.getTime() + monitoringDays * 24 * 60 * 60 * 1000)
          const hasCover = (project.cover_video_count ?? 0) > 0
          const extendedEnd = hasCover
            ? new Date(monitoringEnd.getTime() + 15 * 24 * 60 * 60 * 1000)
            : monitoringEnd
          if (new Date() > extendedEnd) continue
        }

        const inCoverExtension = project.end_date && (project.cover_video_count ?? 0) > 0 &&
          new Date() > new Date(new Date(project.end_date).getTime() + (project.monitoring_extension ?? 0) * 24 * 60 * 60 * 1000)
        const interval = inCoverExtension
          ? (project.base_refresh_interval ?? 12)
          : (project.refresh_interval ?? 12)
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

    // 커버 요청 24시간 미응답 자동 거절
    const { data: pendingCoverRequests } = await supabase
      .from('cover_requests')
      .select('*')
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString())

    if (pendingCoverRequests && pendingCoverRequests.length > 0) {
      for (const r of pendingCoverRequests) {
        await supabase
          .from('cover_requests')
          .update({ status: 'REJECTED', rejected_count: (r.rejected_count ?? 0) + 1 })
          .eq('id', r.id)

        // 의뢰인에게 푸시
        const { data: clientUser } = await supabase
          .from('users')
          .select('id')
          .eq('client_id', r.client_id)
          .maybeSingle()

        if (clientUser) {
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token, user_id')
            .eq('user_id', String(clientUser.id))

          if (tokens && tokens.length > 0) {
            await fetch('https://app.doubleb.kr/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '⚠️ 커버영상 요청이 거절됐어요',
                body: `[${r.project_code}] 24시간 내 응답이 없어 자동 거절됐어요. 재선택해주세요.`,
                tokens: tokens.map((t: any) => t.token),
                userIds: tokens.map((t: any) => t.user_id)
              })
            })
          }
        }
      }
    }

    // 커버영상 7일 미업로드 패널티
    const { data: approvedCoverRequests } = await supabase
      .from('cover_requests')
      .select('*')
      .eq('status', 'APPROVED')
      .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (approvedCoverRequests && approvedCoverRequests.length > 0) {
      for (const r of approvedCoverRequests) {
        // 커버영상 올렸는지 확인
        const { data: coverPost } = await supabase
          .from('posts')
          .select('id')
          .ilike('project_code', r.project_code)
          .eq('member_id', r.participant_id)
          .eq('is_cover', true)
          .maybeSingle()

        if (!coverPost) {
          const penaltyUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('participants').update({ cover_penalty_until: penaltyUntil }).eq('id', r.participant_id)
          await supabase.from('cover_requests').update({ status: 'PENALTY' }).eq('id', r.id)

          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(r.participant_id))
          if (tokens && tokens.length > 0) {
            await fetch('https://app.doubleb.kr/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '⚠️ 커버영상 미업로드 패널티',
                body: '7일 이내 커버영상을 업로드하지 않아 3개월간 커버영상 업로드가 제한됩니다.',
                tokens: tokens.map((t: any) => t.token),
                userIds: tokens.map((t: any) => t.user_id)
              })
            })
          }
        }
      }
    }

    // BANNED 자동 해제
    const { data: bannedParticipants } = await supabase
      .from('participants')
      .select('id, name')
      .not('banned_until', 'is', null)
      .lt('banned_until', new Date().toISOString())

    if (bannedParticipants && bannedParticipants.length > 0) {
      for (const p of bannedParticipants) {
        await supabase.from('participants').update({ banned_until: null }).eq('id', p.id)
        
        const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(p.id))
        if (tokens && tokens.length > 0) {
          await fetch('https://app.doubleb.kr/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '✅ 활동 제한이 해제됐어요!',
              body: '미션 불이행 제한 기간이 끝났어요. 이제 다시 미션에 참여할 수 있어요!',
              tokens: tokens.map((t: any) => t.token),
              userIds: tokens.map((t: any) => t.user_id)
            })
          })
        }
      }
    }

    // 커버 패널티 자동 해제
    const { data: penaltyParticipants } = await supabase
      .from('participants')
      .select('id, name')
      .not('cover_penalty_until', 'is', null)
      .lt('cover_penalty_until', new Date().toISOString())

    if (penaltyParticipants && penaltyParticipants.length > 0) {
      for (const p of penaltyParticipants) {
        await supabase.from('participants').update({ cover_penalty_until: null }).eq('id', p.id)
        
        const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(p.id))
        if (tokens && tokens.length > 0) {
          await fetch('https://app.doubleb.kr/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: '✅ 커버영상 제한이 해제됐어요!',
              body: '커버영상 업로드 제한 기간이 끝났어요. 이제 다시 커버영상 미션에 참여할 수 있어요!',
              tokens: tokens.map((t: any) => t.token),
              userIds: tokens.map((t: any) => t.user_id)
            })
          })
        }
      }
    }

    // 프로젝트 종료일 푸시
      const { data: endingProjects } = await supabase.from('projects').select('*').eq('end_date', today).eq('status', 'ONGOING')
      if (endingProjects && endingProjects.length > 0) {
        for (const project of endingProjects) {
          // 종료시간 체크
          if (project.end_time) {
            const endHour = parseInt(project.end_time.split(':')[0])
            if (currentHour !== endHour) continue
          }

          // 프로젝트 COMPLETED 로 변경
          await supabase.from('projects').update({ status: 'COMPLETED' }).eq('project_code', project.project_code)

          // 참여 체험단에게 푸시
          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (joinedParticipants && joinedParticipants.length > 0) {
            const memberIds = joinedParticipants.map((j: any) => String(j.member_id))
            const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', memberIds)
            if (tokens && tokens.length > 0) {
              await fetch(`https://app.doubleb.kr/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '📅 미션이 종료됐어요!',
                  body: `${project.product_content} 미션이 종료됐어요. 수고하셨어요!`,
                  tokens: tokens.map((t: any) => t.token),
                  userIds: tokens.map((t: any) => t.user_id)
                })
              })
            }
          }

          // 해당 의뢰인에게 푸시
          if (project.client_id) {
            const { data: clientUser } = await supabase.from('users').select('id').eq('client_id', project.client_id).maybeSingle()
            if (clientUser) {
              const { data: clientTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(clientUser.id))
              if (clientTokens && clientTokens.length > 0) {
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '📅 프로젝트가 종료됐어요!',
                    body: `${project.product_content} 프로젝트가 종료됐어요. 결과를 확인해보세요!`,
                    tokens: clientTokens.map((t: any) => t.token),
                    userIds: clientTokens.map((t: any) => t.user_id)
                  })
                })
              }
            }
          }
        }
      }

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
              const ttRes = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${p.tiktok_id.replace('@','')}`, {
                headers: {
                  'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
                  'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
                }
              })
              const ttData = await ttRes.json()
              if (ttData?.data?.stats?.followerCount !== undefined) {
                await supabase.from('participants').update({ tiktok_followers: ttData.data.stats.followerCount }).eq('id', p.id)
              }
            }
          } catch { continue }
        }
      }
    }
    
    // 댓글 삭제 여부 체크 (하루 1회)
    if (currentHour === 3) {
      const { data: approvedMissions } = await supabase
        .from('comment_missions')
        .select('*')
        .eq('status', 'APPROVED')

      if (approvedMissions && approvedMissions.length > 0) {
        for (const mission of approvedMissions) {
          try {
            const res = await fetch(
              `https://www.googleapis.com/youtube/v3/comments?id=${mission.comment_id}&part=snippet&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
            )
            const data = await res.json()
            
            if (!data.items || data.items.length === 0) {
              // 댓글 삭제됨 → 포인트 차감
              const { data: participant } = await supabase
                .from('participants')
                .select('balance')
                .eq('id', mission.member_id)
                .maybeSingle()
              
              const newBalance = Math.max(0, (participant?.balance ?? 0) - (mission.reward_amount ?? 300))
              await supabase.from('participants').update({ balance: newBalance }).eq('id', mission.member_id)
              await supabase.from('comment_missions').update({ status: 'DELETED' }).eq('id', mission.id)

              // 체험단에게 푸시
              const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(mission.member_id))
              if (tokens && tokens.length > 0) {
                await fetch('https://app.doubleb.kr/api/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '⚠️ 댓글 삭제로 적립금이 차감됐어요',
                    body: `댓글이 삭제되어 ${(mission.reward_amount ?? 300).toLocaleString()}P가 차감됐어요.`,
                    tokens: tokens.map((t: any) => t.token),
                    userIds: tokens.map((t: any) => t.user_id)
                  })
                })
              }
            }
          } catch { continue }
        }
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