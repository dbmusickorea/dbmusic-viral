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
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
                    userIds: [String(mission.member_id)],
                    data: { url: '/wallet' }
                  })
                })
              }
            }
          } catch { continue }
        }
      }
    }

    // 인스타그램 비공개 전환 체크 (하루 1회 - 한국시간 오전 10시)
    // 전날 새벭 3시 체크에서 저장된 sns_is_private 값을 그대로 사용 (추가 API 호출 없음)
    if (currentHour === 10) {
      const { data: ongoingProjectsForPrivacy } = await supabase.from('projects').select('project_code, reward_per_post, artist_name, song_title').gte('start_date', fortyFiveDaysAgo)
      if (ongoingProjectsForPrivacy && ongoingProjectsForPrivacy.length > 0) {
        const projectMap = new Map(ongoingProjectsForPrivacy.map((p: any) => [p.project_code, p]))
        const { data: privacyPosts } = await supabase
          .from('posts')
          .select('id, member_id, project_code, is_cover, sns_is_private, private_warning_sent, private_penalty_applied, private_penalty_amount')
          .eq('platform', 'instagram')
          .in('project_code', ongoingProjectsForPrivacy.map((p: any) => p.project_code))

        if (privacyPosts) {
          for (const post of privacyPosts) {
            try {
              const project = projectMap.get(post.project_code)
              if (!project) continue

              if (!post.sns_is_private && post.private_penalty_applied) {
                const { data: participant } = await supabase.from('participants').select('balance, cover_penalty_reason').eq('id', post.member_id).maybeSingle()
                if (participant) {
                  const newBalance = (participant.balance ?? 0) + (post.private_penalty_amount ?? 0)
                  await supabase.from('participants').update({ balance: newBalance }).eq('id', post.member_id)
                  await supabase.from('point_history').insert({
                    member_id: post.member_id, amount: post.private_penalty_amount ?? 0,
                    memo: `비공개 페널티 취소 (공개 전환 확인) (${project.artist_name} / ${project.song_title ?? ''})`,
                    project_code: post.project_code
                  })
                  if (post.is_cover && participant.cover_penalty_reason === 'private') {
                    await supabase.from('participants').update({ cover_penalty_until: null, cover_penalty_reason: null }).eq('id', post.member_id)
                  }
                }
                await supabase.from('posts').update({ private_warning_sent: false, private_penalty_applied: false, private_penalty_amount: 0 }).eq('id', post.id)

                const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(post.member_id))
                if (tokens && tokens.length > 0) {
                  await fetch('https://app.doubleb.kr/api/push', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '✅ 계정 공개 확인, 페널티 취소됐어요',
                      body: '인스타그램 계정이 다시 공개로 확인되어 적용됐던 페널티가 취소됐어요.',
                      tokens: tokens.map((t: any) => t.token), userIds: [String(post.member_id)], data: { url: '/participant' }
                    })
                  })
                }
                continue
              }

              if (!post.sns_is_private && post.private_warning_sent && !post.private_penalty_applied) {
                await supabase.from('posts').update({ private_warning_sent: false }).eq('id', post.id)
                continue
              }

              if (post.sns_is_private && !post.private_warning_sent && !post.private_penalty_applied) {
                await supabase.from('posts').update({ private_warning_sent: true }).eq('id', post.id)
                const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(post.member_id))
                if (tokens && tokens.length > 0) {
                  await fetch('https://app.doubleb.kr/api/push', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '⚠️ 인스타그램 계정이 비공개예요',
                      body: '오늘 자정까지 공개로 전환하지 않으면 적립금 회수 및 페널티가 적용돼요.',
                      tokens: tokens.map((t: any) => t.token), userIds: [String(post.member_id)], data: { url: '/participant' }
                    })
                  })
                }
                continue
              }

              if (post.sns_is_private && post.private_warning_sent && !post.private_penalty_applied) {
                const { data: participant } = await supabase.from('participants').select('balance, level, cover_reward').eq('id', post.member_id).maybeSingle()
                let deductAmount = 0
                if (participant) {
                  const baseAmount = project.reward_per_post ?? 0
                  const level = participant.level ?? 1
                  const earnAmount = level === 50 ? 10000 : Math.min(2500 + (level - 1) * 150, 10000)
                  deductAmount = post.is_cover ? Math.min(baseAmount, earnAmount) + (participant.cover_reward ?? 0) : Math.min(baseAmount, earnAmount)
                  const newBalance = Math.max(0, (participant.balance ?? 0) - deductAmount)
                  await supabase.from('participants').update({ balance: newBalance }).eq('id', post.member_id)
                  await supabase.from('point_history').insert({
                    member_id: post.member_id, amount: -deductAmount,
                    memo: `비공개 계정 페널티 (${project.artist_name} / ${project.song_title ?? ''})`,
                    project_code: post.project_code
                  })
                }
                if (post.is_cover) {
                  const penaltyUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                  await supabase.from('participants').update({ cover_penalty_until: penaltyUntil, cover_penalty_reason: 'private' }).eq('id', post.member_id)
                }
                await supabase.from('posts').update({ private_penalty_applied: true, private_penalty_amount: deductAmount }).eq('id', post.id)

                const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(post.member_id))
                if (tokens && tokens.length > 0) {
                  await fetch('https://app.doubleb.kr/api/push', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '⚠️ 비공개 미전환으로 페널티가 적용됐어요',
                      body: post.is_cover ? '적립금 회수 및 3개월 커버 페널티가 적용됐어요. 공개로 전환하면 취소돼요.' : '적립금이 회수됐어요. 공개로 전환하면 취소돼요.',
                      tokens: tokens.map((t: any) => t.token), userIds: [String(post.member_id)], data: { url: '/wallet' }
                    })
                  })
                }
              }
            } catch { continue }
          }
        }
      }
    }

    // 게시물 유효성 체크 (하루 1회 - 한국시간 새벭 3시)
    if (currentHour === 3) {
      const { data: ongoingPosts } = await supabase
        .from('posts')
        .select('id, post_url, platform, member_id, project_code, likes_count, is_cover')
        .in('project_code', 
          (await supabase.from('projects').select('project_code').gte('start_date', fortyFiveDaysAgo)).data?.map((p: any) => p.project_code) ?? []
        )

      if (ongoingPosts) {
        for (const post of ongoingPosts) {
          try {
            let isValid = true

            if (post.platform === 'instagram') {
              const shortcode = (post.post_url.split('/p/')[1]?.split('/')[0] ?? post.post_url.split('/reel/')[1]?.split('/')[0])?.split('?')[0]
              if (shortcode) {
                const res = await fetch(
                  `https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com/post?shortcode=${shortcode}`,
                  { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com' } }
                )
                const data = await res.json()
                if (!data || data.error || data.status === 'error') isValid = false
                // 같은 응답에 포함된 계정 비공개 여부도 함께 저장 (추가 API 호출 없이)
                if (isValid) await supabase.from('posts').update({ sns_is_private: !!data.user?.is_private }).eq('id', post.id)
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            } else if (post.platform === 'youtube') {
              const videoId = post.post_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1]
              if (videoId) {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`)
                const data = await res.json()
                if (!data.items || data.items.length === 0) isValid = false
              }
            } else if (post.platform === 'tiktok') {
              const res = await fetch(
                `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(post.post_url)}&hd=1`,
                { headers: { 'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992', 'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com' } }
              )
              const data = await res.json()
              if (!data.data) isValid = false
            }

            if (!isValid) {
              // 게시물 삭제 + 적립금 차감
              const { data: participant } = await supabase.from('participants').select('balance, level, cover_reward').eq('id', post.member_id).maybeSingle()
              if (participant) {
                const projectData = (await supabase.from('projects').select('reward_per_post, artist_name, song_title').eq('project_code', post.project_code).maybeSingle()).data
                const baseAmount = projectData?.reward_per_post ?? 0
                const level = participant.level ?? 1
                const earnAmount = level === 50 ? 10000 : Math.min(2500 + (level - 1) * 150, 10000)
                const deductAmount = post.is_cover ? Math.min(baseAmount, earnAmount) + (participant.cover_reward ?? 0) : Math.min(baseAmount, earnAmount)
                const newBalance = Math.max(0, (participant.balance ?? 0) - deductAmount)
                await supabase.from('participants').update({ balance: newBalance }).eq('id', post.member_id)
                await supabase.from('point_history').insert({ 
                  member_id: post.member_id, 
                  amount: -deductAmount, 
                  memo: `게시물 삭제 (SNS 원본 삭제 감지) (${projectData?.artist_name || post.project_code} / ${projectData?.song_title ?? ''})`,
                  project_code: post.project_code
                })
              }
              // 커버 게시물 삭제 시 페널티 처리
              if (post.is_cover) {
                const penaltyUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                await supabase.from('participants').update({ 
                  cover_penalty_until: penaltyUntil,
                  cover_penalty_reason: 'deleted'
                }).eq('id', post.member_id)
                // cover_current 감소
                const { data: projForCover3 } = await supabase.from('projects').select('cover_current').ilike('project_code', post.project_code).maybeSingle()
                if (projForCover3 && (projForCover3.cover_current ?? 0) > 0) {
                  await supabase.from('projects').update({ cover_current: (projForCover3.cover_current ?? 1) - 1 }).ilike('project_code', post.project_code)
                }
              }
              await supabase.from('posts').delete().eq('id', post.id)
              await supabase.from('post_stats_history').delete().eq('post_id', post.id)
              
              // 체험단에게 푸시
              const { data: tokens } = await supabase.from('push_tokens').select('token, user_id').eq('user_id', String(post.member_id))
              if (tokens && tokens.length > 0) {
                await fetch('https://app.doubleb.kr/api/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: '⚠️ 게시물이 삭제됐어요', data: { url: '/participant' },
                    body: post.is_cover ? '커버 게시물 링크가 유효하지 않아 적립금 회수 및 3개월 커버 페널티가 적용됐어요.' : '게시물 링크가 유효하지 않아 적립금 회수 및 삭제 처리됐어요.',
                    tokens: tokens.map((t: any) => t.token),
                    userIds: [String(post.member_id)]
                  })
                })
              }
            }
          } catch { continue }
        }
      }
    }

    // 탈퇴 회원 5년 후 완전 삭제 (하루 1회)
    if (currentHour === 3) {
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      const { data: deletedParticipants } = await supabase
        .from('participants')
        .select('id, email')
        .eq('is_deleted', true)
        .lt('deleted_at', fiveYearsAgo.toISOString())

      if (deletedParticipants && deletedParticipants.length > 0) {
        for (const p of deletedParticipants) {
          try {
            // Auth 삭제
            if (p.email) {
              const { data: authUsers } = await supabase.auth.admin.listUsers()
              const authUser = authUsers?.users?.find((u: any) => u.email === p.email)
              if (authUser) await supabase.auth.admin.deleteUser(authUser.id)
            }
            // participants 완전 삭제
            await supabase.from('participants').delete().eq('id', p.id)
          } catch { continue }
        }
      }
    }

    // auth에만 있고 users/participants 둘 다 없는 계정 자동 삭제 (24시간 이상된 것만)
    if (currentHour === 3) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      if (authUsers?.users) {
        for (const authUser of authUsers.users) {
          try {
            if (new Date(authUser.created_at) > yesterday) continue
            const { data: u } = await supabase.from('users').select('id').eq('email', authUser.email).maybeSingle()
            const { data: p } = await supabase.from('participants').select('id').eq('email', authUser.email).maybeSingle()
            if (!u && !p) {
              await supabase.auth.admin.deleteUser(authUser.id)
            }
          } catch { continue }
        }
      }
    }

    // 채팅 첨부파일: 7일 지난 것 실제 저장소에서 정리 (하루 한 번, 새벭 4시)
    if (currentHour === 4) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const { data: oldAttachments } = await supabase
        .from('chat_messages')
        .select('id, attachment_url')
        .not('attachment_url', 'is', null)
        .lt('created_at', sevenDaysAgo.toISOString())

      if (oldAttachments && oldAttachments.length > 0) {
        const paths = oldAttachments
          .map((m: any) => {
            const marker = '/chat-attachments/'
            const idx = m.attachment_url?.indexOf(marker)
            return idx >= 0 ? m.attachment_url.slice(idx + marker.length) : null
          })
          .filter((p: any): p is string => !!p)
        if (paths.length > 0) {
          await supabase.storage.from('chat-attachments').remove(paths)
        }
      }
    }

    // cover_current 자가치유 재계산 (하루 1회, 새벭 5시)
    // 실제 상태(승인된 cover_requests + 활동중인 project_participants)로부터 정답값을 다시 계산해서
    // 여러 곳에 흩어진 +1/-1 로직이 어긋나도 매일 자동으로 교정되게 함
    if (currentHour === 5) {
      const { data: coverProjects } = await supabase
        .from('projects')
        .select('project_code, cover_current')
        .or('cover_video_count.gt.0,premium_cover_video_count.gt.0')

      if (coverProjects && coverProjects.length > 0) {
        for (const proj of coverProjects) {
          try {
            const { data: approvedRequests } = await supabase
              .from('cover_requests')
              .select('participant_id')
              .eq('project_code', proj.project_code)
              .eq('status', 'APPROVED')

            let correctCount = 0
            if (approvedRequests && approvedRequests.length > 0) {
              const { data: activeParticipants } = await supabase
                .from('project_participants')
                .select('member_id')
                .eq('project_code', proj.project_code)
                .eq('status', 'ACTIVE')
                .in('member_id', approvedRequests.map((r: any) => r.participant_id))
              correctCount = activeParticipants?.length ?? 0
            }

            if ((proj.cover_current ?? 0) !== correctCount) {
              console.log(`[cover-current-fix] ${proj.project_code}: ${proj.cover_current ?? 0} -> ${correctCount}`)
              await supabase.from('projects').update({ cover_current: correctCount }).eq('project_code', proj.project_code)
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
