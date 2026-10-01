import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 참여자별 알림 설정(notification_prefs)에서 해당 종류를 꺼놓은 사람은 토큰 목록에서 제외
async function filterTokensByNotifPref(tokens: any[], prefKey: string) {
  if (!tokens || tokens.length === 0) return tokens
  const userIds = [...new Set(tokens.map((t: any) => t.user_id))]
  const { data: prefs } = await supabase.from('participants').select('id, notification_prefs').in('id', userIds)
  const offIds = new Set((prefs ?? []).filter((p: any) => p.notification_prefs?.master === false || p.notification_prefs?.[prefKey] === false).map((p: any) => String(p.id)))
  return tokens.filter((t: any) => !offIds.has(String(t.user_id)))
}

async function updateProjectLinkStats(links: any[]) {
  for (const link of links) {
    try {
      let likes = 0
      let comments = 0
      let views = 0

      if (link.platform === 'instagram') {
        const shortcode = (link.url.split('/p/')[1]?.split('/')[0] ?? link.url.split('/reel/')[1]?.split('/')[0])?.split('?')[0]
        if (!shortcode) continue
        const res = await fetch(
          `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
          { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com' } }
        )
        const data = await res.json()
        likes = data.like_count ?? 0
        comments = data.comment_count ?? 0
        views = data.view_count ?? data.video_view_count ?? data.play_count ?? 0
        await new Promise(resolve => setTimeout(resolve, 1000))

      } else if (['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(link.platform)) {
        const videoId = link.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1]
        if (!videoId) continue
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
        const data = await res.json()
        const stats = data.items?.[0]?.statistics
        likes = Number(stats?.likeCount ?? 0)
        comments = Number(stats?.commentCount ?? 0)
        views = Number(stats?.viewCount ?? 0)

      } else if (link.platform === 'tiktok') {
        // URL에서 video ID 추출
        const videoIdMatch = link.url.match(/video\/(\d+)/)
        const videoId = videoIdMatch ? videoIdMatch[1] : null
        if (videoId) {
          // tiktok-api23으로 먼저 시도
          const res = await fetch(
            `https://tiktok-api23.p.rapidapi.com/api/post/detail?videoId=${videoId}`,
            { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com' } }
          )
          const data = await res.json()
          const stats = data?.itemInfo?.itemStruct?.stats
          if (stats && (stats.playCount > 0 || stats.diggCount > 0)) {
            likes = stats.diggCount ?? 0
            comments = stats.commentCount ?? 0
            views = stats.playCount ?? 0
          } else {
            // 실패 시 tiktok-scraper7 시도
            const res2 = await fetch(
              `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(link.url)}&hd=1`,
              { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' } }
            )
            const data2 = await res2.json()
            if (data2.data?.play_count > 0 || data2.data?.digg_count > 0) {
              likes = data2.data?.digg_count ?? 0
              comments = data2.data?.comment_count ?? 0
              views = data2.data?.play_count ?? 0
            } else {
              // 둘 다 실패하면 기존 값 유지 (업데이트 스킵)
              continue
            }
          }
        }
      }

      await supabase.from('project_links').update({ likes_count: likes, comments_count: comments, views_count: views }).eq('id', link.id)
    } catch { continue }
  }
}
async function updatePostStats(posts: any[]) {
  let updated = 0
  for (const post of posts) {
    try {
      let likes = 0
      let comments = 0
      let views = 0

      if (post.platform === 'instagram') {
        const shortcode = (post.post_url.split('/p/')[1]?.split('/')[0] ?? post.post_url.split('/reel/')[1]?.split('/')[0])?.split('?')[0]
        if (!shortcode) continue
        const res = await fetch(
          `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
          { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com' } }
        )
        const data = await res.json()
        if (data.like_count === undefined) continue // API 실패 시 0으로 덮어쓰지 않고 건너뜀
        likes = data.like_count ?? 0
        comments = data.comment_count ?? 0
        views = data.view_count ?? data.video_view_count ?? data.play_count ?? 0
        await new Promise(resolve => setTimeout(resolve, 1000))

      } else if (post.platform === 'youtube') {
        const videoId = post.post_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1]
        if (!videoId) continue
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
        const data = await res.json()
        const stats = data.items?.[0]?.statistics
        likes = Number(stats?.likeCount ?? 0)
        comments = Number(stats?.commentCount ?? 0)
        views = Number(stats?.viewCount ?? 0)

      } else if (post.platform === 'tiktok') {
        const ttVideoIdMatch = post.post_url.match(/video\/(\d+)/)
        const ttVideoId = ttVideoIdMatch ? ttVideoIdMatch[1] : null
        if (ttVideoId) {
          const res = await fetch(
            `https://tiktok-api23.p.rapidapi.com/api/post/detail?videoId=${ttVideoId}`,
            { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com' } }
          )
          const data = await res.json()
          const stats = data?.itemInfo?.itemStruct?.stats
          if (stats) {
            likes = stats.diggCount ?? 0
            comments = stats.commentCount ?? 0
            views = stats.playCount ?? 0
          } else {
            const res2 = await fetch(
              `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(post.post_url)}&hd=1`,
              { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' } }
            )
            const data2 = await res2.json()
            likes = data2.data?.digg_count ?? 0
            comments = data2.data?.comment_count ?? 0
            views = data2.data?.play_count ?? 0
          }
        }
      }

      await supabase.from('posts').update({ likes_count: likes, comments_count: comments, views_count: views }).eq('id', post.id)
      updated++
    } catch { continue }
  }
  return updated
}

async function updateAdminChannelLikes() {
  const { data: posts } = await supabase.from('posts').select('id, admin_channel_url').not('admin_channel_url', 'is', null).neq('admin_channel_url', '')
  if (!posts) return
  for (const post of posts) {
    try {
      const url = post.admin_channel_url as string
      let likes = 0

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1]
        if (!videoId) continue
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
        const data = await res.json()
        likes = Number(data.items?.[0]?.statistics?.likeCount ?? 0)

      } else if (url.includes('instagram.com')) {
        const shortcode = (url.split('/p/')[1]?.split('/')[0] ?? url.split('/reel/')[1]?.split('/')[0])?.split('?')[0]
        if (!shortcode) continue
        const res = await fetch(
          `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
          { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com' } }
        )
        const data = await res.json()
        likes = data.like_count ?? 0
        await new Promise(resolve => setTimeout(resolve, 1000))

      } else if (url.includes('tiktok.com')) {
        const ttVideoIdMatch = url.match(/video\/(\d+)/)
        const ttVideoId = ttVideoIdMatch ? ttVideoIdMatch[1] : null
        if (ttVideoId) {
          const res = await fetch(
            `https://tiktok-api23.p.rapidapi.com/api/post/detail?videoId=${ttVideoId}`,
            { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com' } }
          )
          const data = await res.json()
          likes = data?.itemInfo?.itemStruct?.stats?.diggCount ?? 0
        }
      } else {
        continue
      }

      await supabase.from('posts').update({ admin_channel_likes: likes }).eq('id', post.id)
    } catch { continue }
  }
}

export async function GET() {
  try {
    await updateAdminChannelLikes()
    const now = new Date()
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const currentHour = kstNow.getUTCHours()
    const today = kstNow.toISOString().split('T')[0]

    // refresh_interval이 있는 프로젝트 - 시간별 조건부 갱신
    const { data: intervalProjects } = await supabase
      .from('projects')
      .select('project_code, refresh_interval, base_refresh_interval, end_date, status, cover_video_count, premium_cover_video_count, monitoring_extension')
      .in('status', ['ONGOING', 'COMPLETED'])
      .not('refresh_interval', 'is', null)

    if (intervalProjects && intervalProjects.length > 0) {
      for (const project of intervalProjects) {
        if (project.end_date) {
          const endDate = new Date(project.end_date)
          // end_date 자체에 이미 (기본 15일 + 모니터링 연장일수)가 반영되어 저장되므로 여기서 추가로 더하지 않음
          const monitoringEnd = endDate
          
          // 커버 옵션 선택한 프로젝트만 추가 15일 연장
          const hasCover = (project.cover_video_count ?? 0) > 0 || (project.premium_cover_video_count ?? 0) > 0
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
            const { data: projectLinks } = await supabase.from('project_links').select('*').ilike('project_code', project.project_code)
            if (projectLinks) await updateProjectLinkStats(projectLinks)
          }
        } else {
          const interval = project.refresh_interval
          if (interval && currentHour % interval === 0) {
            const { data: projectPosts } = await supabase.from('posts').select('*').ilike('project_code', project.project_code)
            if (projectPosts) await updatePostStats(projectPosts)
            const { data: projectLinks } = await supabase.from('project_links').select('*').ilike('project_code', project.project_code)
            if (projectLinks) await updateProjectLinkStats(projectLinks)
          }
        }
      }
    }

    // 기본 갱신 - 한국시간 새벽 3시에만 실행
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
            // end_date 자체에 이미 모니터링 연장일수가 반영되어 저장되므로 여기서 추가로 더하지 않음
            const monitoringEndDate = new Date(project.end_date)
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
    const { data: recruitProjects } = await supabase.from('projects').select('*').eq('mission_date', today).in('status', ['ONGOING', 'PENDING']).eq('recruit_push_sent', false)
    if (recruitProjects && recruitProjects.length > 0) {
      const { data: rawParticipantTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'participant')
      const participantTokens = await filterTokensByNotifPref(rawParticipantTokens ?? [], 'recruit')
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
              body: `${project.artist_name || project.client_name} - ${project.song_title} 프로젝트 모집이 시작됐어요! 지금 참여하세요!`,
              tokens: participantTokens.map((t: any) => t.token),
              userIds: participantTokens.map((t: any) => t.user_id),
              data: { url: '/participant?tab=project' },
              saveToRole: 'participant'
            })
          })
          await supabase.from('projects').update({ recruit_push_sent: true }).eq('project_code', project.project_code)
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
                    body: `${project.artist_name || project.client_name} - ${project.song_title} 미션이 시작됐어요! 48시간 안에 게시물을 올려주세요. ⚠️ 미업로드 시 레벨 하락 및 7일간 활동 제한됩니다.`,
                    tokens: normalTokens.map((t: any) => t.token),
                    userIds: normalIds.map(String),
                    data: { url: '/participant?tab=project' }
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
                    title: '🎵 커버영상 미션이 시작됐어요!', data: { url: '/participant' },
                    body: `${project.artist_name || project.client_name} - ${project.song_title} 커버영상 미션이 시작됐어요! ${new Date(new Date(project.start_date).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}까지 업로드해주세요.`,
                    tokens: coverTokens.map((t: any) => t.token),
                    userIds: coverIds.map(String)
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
                  title: '📅 2차 미션이 시작됐어요!', data: { url: '/participant' },
                  body: `${project.artist_name || project.client_name} - ${project.song_title} 2차 게시물을 48시간 안에 올려주세요. ⚠️ 미업로드 시 레벨 하락 및 7일간 활동 제한됩니다.`,
                  tokens: tokens.map((t: any) => t.token),
                  userIds: memberIds
                })
              })
            }
          }
        }
      }

      // 24시간 리마인드 체크 (마감 24시간 전까지 미업로드 시 독려 알림, 하루 1번만)
      const { data: reminderProjects } = await supabase.from('projects').select('*').eq('status', 'ONGOING').not('start_date', 'is', null)
      if (reminderProjects && reminderProjects.length > 0) {
        for (const project of reminderProjects) {
          if (!project.mission_time) continue

          const { data: joinedParticipantsForReminder } = await supabase.from('project_participants').select('id, member_id, is_cover, status, joined_at, reminder_sent').ilike('project_code', project.project_code)
          if (!joinedParticipantsForReminder) continue

          for (const jp of joinedParticipantsForReminder) {
            if (jp.is_cover) continue
            if (jp.status !== 'ACTIVE') continue
            if (jp.reminder_sent) continue
            if (!jp.joined_at) continue

            const joinedTime = new Date(jp.joined_at).getTime()
            const twentyFourHoursAfterJoin = joinedTime + 24 * 60 * 60 * 1000
            const fortyEightHoursAfterJoin = joinedTime + 48 * 60 * 60 * 1000
            if (now.getTime() < twentyFourHoursAfterJoin || now.getTime() >= fortyEightHoursAfterJoin) continue

            const { data: post } = await supabase.from('posts').select('id').ilike('project_code', project.project_code).eq('member_id', jp.member_id).maybeSingle()
            if (post) continue

            await supabase.from('project_participants').update({ reminder_sent: true }).eq('id', jp.id)

            const { data: rawTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(jp.member_id))
            const tokens = await filterTokensByNotifPref(rawTokens ?? [], 'reminder')
            if (tokens && tokens.length > 0) {
              await fetch('https://app.doubleb.kr/api/push', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: '⏰ 게시물 업로드 잊지 않으셨나요?',
                  body: `${project.artist_name || project.client_name} - ${project.song_title} 게시물 업로드 마감까지 24시간 남았어요! 참여신청 후 48시간 이내 미업로드 시 레벨 하락 및 7일간 활동 제한됩니다.`,
                  tokens: tokens.map((t: any) => t.token), userIds: [String(jp.member_id)], data: { url: '/participant' }
                })
              })
            }
          }
        }
      }

      // 미션 불이행 체크
      const { data: missionDayProjects } = await supabase.from('projects').select('*').eq('status', 'ONGOING').not('start_date', 'is', null)
      if (missionDayProjects && missionDayProjects.length > 0) {
        for (const project of missionDayProjects) {
          if (!project.mission_time) continue
          const missionDateTime = new Date(`${project.start_date}T${project.mission_time}:00`)
          const twentyFourHoursAfter = new Date(missionDateTime.getTime() + 48 * 60 * 60 * 1000)
          if (now < twentyFourHoursAfter) continue

          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id, is_cover, status, ban_exempt, joined_at').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (!joinedParticipants) continue

          for (const jp of joinedParticipants) {
            if (jp.is_cover) continue
            if (jp.ban_exempt) continue
            if (jp.joined_at && new Date(jp.joined_at).getTime() + 48 * 60 * 60 * 1000 > now.getTime()) continue
            // 밴 면제 처리된 경우 건너뜀
            const { data: post } = await supabase.from('posts').select('id').ilike('project_code', project.project_code).eq('member_id', jp.member_id).maybeSingle()
            if (!post) {
              const { data: participant } = await supabase.from('participants').select('id, level').eq('id', jp.member_id).maybeSingle()
              if (participant) {
                const newLevel = Math.max(1, (participant.level ?? 1) - 10)
                const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                await supabase.from('participants').update({ level: newLevel, banned_until: bannedUntil.toISOString(), ban_reason: `${project.artist_name || project.client_name} / ${project.song_title ?? ''} - 1차 게시물 미업로드` }).eq('id', participant.id)
                await supabase.from('project_participants').update({ status: 'BANNED' }).ilike('project_code', project.project_code).eq('member_id', participant.id)
                
                // 해당 체험단에게 레벨 하락 푸시
                const { data: rawMemberTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(participant.id))
                const memberTokens = await filterTokensByNotifPref(rawMemberTokens ?? [], 'ban')
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '⚠️ 미션 불이행으로 활동이 제한됐어요!',
                    body: `미션을 완료하지 않아 Lv.${newLevel}으로 하락했어요. 7일간 미션 참여가 제한됩니다.`,
                    tokens: memberTokens?.map((t: any) => t.token) ?? [],
                    userIds: [String(participant.id)],
                    data: { url: '/participant' }
                  })
                })
                
                // 정원이 있을때만 공석 알림
                if (!project.max_participants || project.max_participants <= 0) continue
                const { data: allTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_role', 'participant')
                // 이미 참여중인 사람 제외 (최신 데이터로 재조회)
                const { data: latestJoined } = await supabase.from('project_participants').select('member_id, status').ilike('project_code', project.project_code)
                const joinedMemberIds = (latestJoined ?? []).filter((jp: any) => jp.status === 'ACTIVE' || jp.status === 'BANNED').map((jp: any) => String(jp.member_id))
                const vacancyCandidates = allTokens?.filter((t: any) => !joinedMemberIds.includes(String(t.user_id))) ?? []
                const filteredTokens = await filterTokensByNotifPref(vacancyCandidates, 'vacancy')
                if (filteredTokens.length > 0) {
                  await fetch(`https://app.doubleb.kr/api/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '🔔 추가 모집 공고!', data: { url: '/participant' },
                      body: `${project.artist_name || project.client_name} - ${project.song_title} 프로젝트 공석이 생겼어요! 지금 참여하세요!`,
                      tokens: filteredTokens.map((t: any) => t.token),
                      userIds: filteredTokens.map((t: any) => t.user_id),
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

          const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id, is_cover, ban_exempt').ilike('project_code', project.project_code).eq('status', 'ACTIVE')
          if (!joinedParticipants) continue

          for (const jp of joinedParticipants) {            
            if (jp.ban_exempt) continue  // 밴 면제 처리된 경우 건너뜀
            const { data: posts } = await supabase.from('posts').select('id').ilike('project_code', project.project_code).eq('member_id', jp.member_id).eq('is_cover', false)
            if (!posts || posts.length < 2) {
              const { data: participant } = await supabase.from('participants').select('*').eq('id', jp.member_id).maybeSingle()
              if (participant) {
                const newLevel = Math.max(1, (participant.level ?? 1) - 10)
                const bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                await supabase.from('participants').update({ level: newLevel, banned_until: bannedUntil.toISOString(), ban_reason: `${project.artist_name || project.client_name} / ${project.song_title ?? ''} - 2차 게시물 미업로드` }).eq('id', participant.id)
                await supabase.from('project_participants').update({ status: 'BANNED' }).ilike('project_code', project.project_code).eq('member_id', participant.id)
                
                const { data: rawMemberTokens2 } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(participant.id))
                const memberTokens = await filterTokensByNotifPref(rawMemberTokens2 ?? [], 'ban')
                if (memberTokens && memberTokens.length > 0) {
                  await fetch(`https://app.doubleb.kr/api/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '⚠️ 2차 미션 불이행으로 활동이 제한됐어요!', data: { url: '/participant' },
                      body: `2차 게시물을 올리지 않아 Lv.${newLevel}으로 하락했어요. 7일간 미션 참여가 제한됩니다.`,
                      tokens: memberTokens.map((t: any) => t.token),
                      userIds: [String(participant.id)]
                    })
                  })
                }
              }
            }
          }
        }
      }

      // 1개월 미활동 락 체크는 폐지됨(2026-09-17) - 회원 수가 적을 때 참여 유도 목적으로 만들었으나,
      // 회원이 늘면서 선착순 마감으로 참여 기회 자체가 없었던 사람까지 억울하게 잠기는 구조적 문제가 있어 제거.
      // 미활동자에게는 아래의 자동 푸시 알림으로 계속 참여를 유도함(잠금 없이)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      // 미참여자 자동 푸시
      const { data: ongoingProjects } = await supabase.from('projects').select('project_code').eq('status', 'ONGOING')
      if (ongoingProjects && ongoingProjects.length > 0) {
        const { data: allParticipantsInactive } = await supabase.from('participants').select('id, created_at')
        const { data: joinedParticipants } = await supabase.from('project_participants').select('member_id').in('status', ['ACTIVE', 'BANNED'])
        const joinedIds = new Set(joinedParticipants?.map(j => j.member_id) ?? [])
        const notJoined = allParticipantsInactive?.filter(p => !joinedIds.has(p.id)) ?? []
        if (notJoined.length > 0 && currentHour === 10) {
          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', notJoined.map(p => String(p.id)))
          if (tokens && tokens.length > 0) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '🎵 새 프로젝트가 기다리고 있어요!',
                body: '아직 참여한 프로젝트가 없어요. 지금 참여해보세요!',
                tokens: tokens.map((t: any) => t.token),
                userIds: notJoined.map(p => String(p.id)),
                data: { url: '/participant?tab=project' }
              })
            })
          }
        }
      }

      // 미활동자 자동 푸시 (지금 참여 가능한 프로젝트가 있을 때만)
      if (ongoingProjects && ongoingProjects.length > 0) {
        const { data: allParticipantsInactive } = await supabase.from('participants').select('id, created_at')
        const inactive: number[] = []
        for (const p of allParticipantsInactive ?? []) {
          // 가입 1개월 미만 제외
          if (new Date(p.created_at) > oneMonthAgo) continue
          
          const { data: recentPostInactive } = await supabase.from('posts').select('id').eq('member_id', p.id).gte('created_at', oneMonthAgo.toISOString()).limit(1)
          const { data: currentJoin } = await supabase.from('project_participants').select('id').eq('member_id', p.id).eq('status', 'ACTIVE').limit(1)
          if ((!recentPostInactive || recentPostInactive.length === 0) && (!currentJoin || currentJoin.length === 0)) inactive.push(p.id)
        }
        if (inactive.length > 0 && currentHour === 10) {
          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').in('user_id', inactive.map(id => String(id)))
          if (tokens && tokens.length > 0) {
            await fetch(`https://app.doubleb.kr/api/push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '💪 오랫동안 활동이 없었어요!',
                body: '새로운 프로젝트가 기다리고 있어요. 지금 참여해보세요!',
                tokens: tokens.map((t: any) => t.token),
                userIds: inactive.map(id => String(id)),
                data: { url: '/participant?tab=project' }
              })
            })
          }
        }
      }
    
    
    // 커버 요청 24시간 미응답 자동 거절
    const { data: pendingCoverRequests } = await supabase
      .from('cover_requests')
      .select('*, projects(artist_name, song_title)')
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
                title: '⚠️ 커버영상 요청이 거절됐어요', data: { url: '/cover' },
                body: `[${r.projects?.artist_name} / ${r.projects?.song_title}] 24시간 내 응답이 없어 자동 거절됐어요. 재선택해주세요.`,
                tokens: tokens.map((t: any) => t.token),
                userIds: [String(clientUser.id)]
              })
            })
          }
        }
      }
    }

    // 미션 시작(당일 포함) 후 원곡(미리듣기) 파일 삭제 - 더 이상 필요 없음
    const { data: audioCleanupProjects } = await supabase
      .from('projects')
      .select('project_code, cover_audio_path, start_date')
      .not('cover_audio_path', 'is', null)
      .not('start_date', 'is', null)

    if (audioCleanupProjects && audioCleanupProjects.length > 0) {
      for (const ap of audioCleanupProjects) {
        if (new Date(ap.start_date) > now) continue // 아직 미션 시작 전이면 유지
        await supabase.storage.from('cover-audio').remove([ap.cover_audio_path])
        await supabase.from('projects').update({ cover_audio_path: null }).eq('project_code', ap.project_code)
      }
    }

    // 미션 시작 15일 경과 시 MR 파일 삭제
    const { data: mrProjects } = await supabase
      .from('projects')
      .select('project_code, cover_mr_path, start_date')
      .not('cover_mr_path', 'is', null)
      .not('start_date', 'is', null)

    if (mrProjects && mrProjects.length > 0) {
      for (const mp of mrProjects) {
        const mrDeadline = new Date(new Date(mp.start_date).getTime() + 15 * 24 * 60 * 60 * 1000)
        if (now < mrDeadline) continue
        await supabase.storage.from('cover-audio').remove([mp.cover_mr_path])
        await supabase.from('projects').update({ cover_mr_path: null }).eq('project_code', mp.project_code)
      }
    }

    // 커버영상 15일 미업로드 패널티 (미션 시작일 기준)
    const { data: approvedCoverRequests } = await supabase
      .from('cover_requests')
      .select('*, projects(start_date)')
      .eq('status', 'APPROVED')

    if (approvedCoverRequests && approvedCoverRequests.length > 0) {
      for (const r of approvedCoverRequests) {
        // 미션 시작일로부터 15일 체크
        const startDate = new Date(r.projects?.start_date)
        const deadline = new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        if (now < deadline) continue  // 아직 15일 안 지남

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
          await supabase.from('participants').update({ cover_penalty_until: penaltyUntil, cover_penalty_reason: 'not_uploaded' }).eq('id', r.participant_id)
          await supabase.from('cover_requests').update({ status: 'PENALTY' }).eq('id', r.id)
          // cover_current 감소
          const { data: projForCover } = await supabase.from('projects').select('cover_current').ilike('project_code', r.project_code).maybeSingle()
          if (projForCover && (projForCover.cover_current ?? 0) > 0) {
            await supabase.from('projects').update({ cover_current: (projForCover.cover_current ?? 1) - 1 }).ilike('project_code', r.project_code)
          }

          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(r.participant_id))
          if (tokens && tokens.length > 0) {
            await fetch('https://app.doubleb.kr/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '⚠️ 커버영상 미업로드 패널티', data: { url: '/participant' },
                body: '15일 이내 커버영상을 업로드하지 않아 3개월간 커버영상 업로드가 제한됩니다.',
                tokens: tokens.map((t: any) => t.token),
                userIds: [String(r.participant_id)]
              })
            })
          }
        }
      }
    }

    // project_participants is_cover = true 인 사람 15일 체크
    const { data: coverParticipants } = await supabase
      .from('project_participants')
      .select('member_id, project_code, projects(start_date)')
      .eq('is_cover', true)
      .eq('status', 'ACTIVE')
      .eq('cover_requested', true)

    if (coverParticipants && coverParticipants.length > 0) {
      for (const cp of coverParticipants) {
        const projectData = Array.isArray(cp.projects) ? cp.projects[0] : cp.projects
        const startDate = new Date((projectData as any)?.start_date)
        const deadline = new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        if (now < deadline) continue

        const { data: coverPost } = await supabase
          .from('posts')
          .select('id')
          .ilike('project_code', cp.project_code)
          .eq('member_id', cp.member_id)
          .eq('is_cover', true)
          .maybeSingle()

        if (!coverPost) {
          // 이미 페널티 처리된 경우 스킵
          const { data: participant } = await supabase.from('participants').select('cover_penalty_until').eq('id', cp.member_id).maybeSingle()
          if (participant?.cover_penalty_until) continue
          
          const penaltyUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('participants').update({ cover_penalty_until: penaltyUntil, cover_penalty_reason: 'not_uploaded' }).eq('id', cp.member_id)
          // cover_current 감소
          const { data: projForCover2 } = await supabase.from('projects').select('cover_current').ilike('project_code', cp.project_code).maybeSingle()
          if (projForCover2 && (projForCover2.cover_current ?? 0) > 0) {
            await supabase.from('projects').update({ cover_current: (projForCover2.cover_current ?? 1) - 1 }).ilike('project_code', cp.project_code)
          }

          const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(cp.member_id))
          if (tokens && tokens.length > 0) {
            await fetch('https://app.doubleb.kr/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '⚠️ 커버영상 미업로드 패널티', data: { url: '/participant' },
                body: '15일 이내 커버영상을 업로드하지 않아 3개월간 커버영상 업로드가 제한됩니다.',
                tokens: tokens.map((t: any) => t.token),
                userIds: [String(cp.member_id)]
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
              title: '✅ 활동 제한이 해제됐어요!', data: { url: '/participant' },
              body: '미션 불이행 제한 기간이 끝났어요. 이제 다시 미션에 참여할 수 있어요!',
              tokens: tokens.map((t: any) => t.token),
              userIds: [String(p.id)]
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
              title: '✅ 커버영상 제한이 해제됐어요!', data: { url: '/participant' },
              body: '커버영상 업로드 제한 기간이 끝났어요. 이제 다시 커버영상 미션에 참여할 수 있어요!',
              tokens: tokens.map((t: any) => t.token),
              userIds: [String(p.id)]
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

          // 에이전시 수수료 계산
          const { data: projectPointHistory } = await supabase
            .from('point_history')
            .select('member_id, amount')
            .eq('project_code', project.project_code)
            .gt('amount', 0)

          if (projectPointHistory && projectPointHistory.length > 0) {
            // 참여 체험단별 리워드 합계
            const memberRewards: Record<number, number> = {}
            projectPointHistory.forEach((ph: any) => {
              memberRewards[ph.member_id] = (memberRewards[ph.member_id] ?? 0) + ph.amount
            })

            // 에이전시 대표 목록
            const { data: agencies } = await supabase.from('participants').select('id, referral_code, agency_commission').eq('is_agency', true)
            if (agencies) {
              for (const agency of agencies) {
                // 소속 체험단 조회
                const { data: agencyMembers } = await supabase.from('participants').select('id').eq('referred_by', agency.referral_code)
                if (!agencyMembers || agencyMembers.length === 0) continue

                // 소속 체험단의 해당 프로젝트 리워드 합계
                let totalReward = 0
                agencyMembers.forEach((m: any) => {
                  totalReward += memberRewards[m.id] ?? 0
                })
                if (totalReward === 0) continue

                // 수수료 계산
                const commission = Math.floor(totalReward * (agency.agency_commission ?? 0) / 100)
                if (commission === 0) continue

                // agency_balance 업데이트
                const { data: agencyData } = await supabase.from('participants').select('agency_balance').eq('id', agency.id).maybeSingle()
                await supabase.from('participants').update({
                  agency_balance: (agencyData?.agency_balance ?? 0) + commission
                }).eq('id', agency.id)

                // 에이전시 대표에게 푸시
                const { data: agencyTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(agency.id))
                if (agencyTokens && agencyTokens.length > 0) {
                  await fetch('https://app.doubleb.kr/api/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '💰 수수료가 적립됐어요!',
                      body: `${project.artist_name || project.client_name} - ${project.song_title} 프로젝트 수수료 ${commission.toLocaleString()}P가 적립됐어요.`,
                      tokens: agencyTokens.map((t: any) => t.token),
                      userIds: [String(agency.id)],
                      data: { url: '/agency-member' }
                    })
                  })
                }
              }
            }
          }

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
                  body: `${project.artist_name || project.client_name} - ${project.song_title} 미션이 종료됐어요. 수고하셨어요!`,
                  tokens: tokens.map((t: any) => t.token),
                  userIds: memberIds,
                  data: { url: '/participant' }
                })
              })
            }
          }

          // 해당 의뢰인에게 푸시
          if (project.client_id) {
            const { data: clientUser } = await supabase.from('users').select('id, notification_prefs').eq('client_id', project.client_id).maybeSingle()
            if (clientUser && clientUser.notification_prefs?.master !== false && clientUser.notification_prefs?.project !== false) {
              const { data: clientTokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(clientUser.id))
              if (clientTokens && clientTokens.length > 0) {
                await fetch(`https://app.doubleb.kr/api/push`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '📅 프로젝트가 종료됐어요!',
                    body: `${project.artist_name || project.client_name} - ${project.song_title} 프로젝트가 종료됐어요. 결과를 확인해보세요!`,
                    tokens: clientTokens.map((t: any) => t.token),
                    userIds: [String(clientUser.id)],
                    data: { url: '/client' },
                    notifRole: 'client'
                  })
                })
              }
            }
          }
        }
      }

      // 음원 사용량 갱신 (refresh_interval 기준)
        const { data: projectsWithAudio } = await supabase
          .from('projects')
          .select('project_code, instagram_audio_id, tiktok_audio_id, youtube_audio_id, refresh_interval')
          .or('instagram_audio_id.not.is.null,tiktok_audio_id.not.is.null,youtube_audio_id.not.is.null')
          .in('status', ['ONGOING', 'PAUSED'])

        if (projectsWithAudio) {
          for (const project of projectsWithAudio) {
            const interval = project.refresh_interval ?? 12
            if (currentHour % interval !== 0) continue
            const updates: any = {}
                    
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
                const tiktokId = project.tiktok_audio_id.match(/(\d{10,})/)?.[1] ?? project.tiktok_audio_id
                const res = await fetch(`https://api.sociavault.com/v1/scrape/tiktok/music/videos?clipId=${tiktokId}`, {
                  headers: { 'x-api-key': process.env.SOCIAVAULT_API_KEY! }
                })
                const data = await res.json()
                const videos = data?.data?.aweme_list ?? {}
                updates.tiktok_audio_count = Object.keys(videos).length
                console.log(`[음원사용-틱톡] ${project.project_code} clipId=${tiktokId} count=${updates.tiktok_audio_count} raw=${JSON.stringify(data).slice(0, 500)}`)
              } catch (e) {
                console.error(`[음원사용-틱톡 실패] ${project.project_code}`, e)
              }
            }

            if (project.youtube_audio_id) {
              try {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${project.youtube_audio_id}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
                const data = await res.json()
                updates.youtube_audio_count = Number(data?.items?.[0]?.statistics?.viewCount ?? 0)
              } catch { }
            }

            const { error: updateError } = await supabase.from('projects').update(updates).eq('project_code', project.project_code)

            // 음원사용량 스냅샷 저장
            if (Object.keys(updates).length > 0) {
              const snapshotKey = `${today}_${currentHour}`
              const { data: existingAudio } = await supabase
                .from('post_stats_history')
                .select('id')
                .eq('project_code', project.project_code)
                .eq('recorded_at', snapshotKey)
                .eq('platform', 'audio')
                .maybeSingle()

              if (existingAudio) {
                await supabase.from('post_stats_history').update({
                  ig_audio_count: updates.instagram_audio_count ?? null,
                  tt_audio_count: updates.tiktok_audio_count ?? null,
                  yt_audio_count: updates.youtube_audio_count ?? null,
                }).eq('id', existingAudio.id)
              } else {
                await supabase.from('post_stats_history').insert({
                  post_id: 0,
                  project_code: project.project_code,
                  platform: 'audio',
                  recorded_at: snapshotKey,
                  ig_audio_count: updates.instagram_audio_count ?? null,
                  tt_audio_count: updates.tiktok_audio_count ?? null,
                  yt_audio_count: updates.youtube_audio_count ?? null,
                  likes_count: 0,
                  comments_count: 0,
                  views_count: 0,
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