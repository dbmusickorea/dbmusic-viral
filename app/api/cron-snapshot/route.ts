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
    const today = kstNow.toISOString().split('T')[0]

    console.log('스냅샷 저장 블록 시작')
    // 프로젝트별 refresh_interval에 맞게 스냅샷 저장
    const { data: ongoingProjectsForSnapshot } = await supabase
      .from('projects')
      .select('project_code, refresh_interval, base_refresh_interval, end_date, monitoring_extension, cover_video_count, premium_cover_video_count')
      .in('status', ['ONGOING', 'COMPLETED'])

    if (ongoingProjectsForSnapshot && ongoingProjectsForSnapshot.length > 0) {
      for (const project of ongoingProjectsForSnapshot) {
        // 종료일 + 모니터링 연장 + 커버 연장 계산
        if (project.end_date) {
          // end_date 자체에 이미 (기본 15일 + 모니터링 연장일수)가 반영되어 저장되므로 여기서 추가로 더하지 않음
          const monitoringEnd = new Date(project.end_date)
          const hasCover = (project.cover_video_count ?? 0) > 0 || (project.premium_cover_video_count ?? 0) > 0
          const extendedEnd = hasCover
            ? new Date(monitoringEnd.getTime() + 15 * 24 * 60 * 60 * 1000)
            : monitoringEnd
          if (new Date() > extendedEnd) continue
        }

        const inCoverExtension = project.end_date && ((project.cover_video_count ?? 0) > 0 || (project.premium_cover_video_count ?? 0) > 0) &&
          new Date() > new Date(project.end_date)
        const interval = inCoverExtension
          ? (project.base_refresh_interval ?? 12)
          : (project.refresh_interval ?? 12)
        if (currentHour % interval !== 0) continue
        console.log(`스냅샷 저장: ${project.project_code}, interval: ${interval}, currentHour: ${currentHour}`)

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
              views_count: post.views_count ?? 0,
              recorded_at: snapshotKey
            })
          }
        }

        // project_links 스냅샷 저장
        const { data: projectLinks } = await supabase.from('project_links').select('*').ilike('project_code', project.project_code)
        if (projectLinks) {
          for (const link of projectLinks) {
            const snapshotKey = `${today}_${currentHour}`
            const { data: existingLink } = await supabase
              .from('post_stats_history')
              .select('id')
              .eq('link_id', link.id)
              .eq('recorded_at', snapshotKey)
              .maybeSingle()

            if (existingLink) {
              await supabase.from('post_stats_history').update({
                likes_count: link.likes_count ?? 0,
                comments_count: link.comments_count ?? 0,
                views_count: link.views_count ?? 0,
              }).eq('id', existingLink.id)
            } else {
              await supabase.from('post_stats_history').insert({
                post_id: 0,
                link_id: link.id,
                project_code: link.project_code,
                member_id: null,
                platform: link.platform,
                likes_count: link.likes_count ?? 0,
                comments_count: link.comments_count ?? 0,
                views_count: link.views_count ?? 0,
                recorded_at: snapshotKey
              })
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) })
  }
}
