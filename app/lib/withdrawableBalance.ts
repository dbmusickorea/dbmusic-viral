import { SupabaseClient } from '@supabase/supabase-js'

// 환전 가능 금액 계산 (participant-data/route.ts의 계산 로직과 동일한 규칙)
// - 프로젝트 무관 내역(추천인 등) - 항상 포함
// - 일반 프로젝트 관련 내역 - 프로젝트 종료 시 포함
// - 커버 관련 내역 - 프로젝트 종료일로부터 15일 경과 후에만 포함
// - 이미 PENDING/APPROVED 상태인 기존 환전신청 금액은 차감
export async function getWithdrawableBalance(client: SupabaseClient, memberId: string | number): Promise<number> {
  const [pointHistoryRes, participationsRes, settlementsRes] = await Promise.all([
    client.from('point_history').select('*').eq('member_id', memberId),
    client.from('project_participants').select('*').eq('member_id', memberId),
    client.from('settlements').select('*').eq('member_id', memberId)
  ])

  const participationCodes = participationsRes.data?.map((p: any) => p.project_code) ?? []
  const myProjectsRes = participationCodes.length > 0
    ? await client.from('projects').select('*').in('project_code', participationCodes)
    : { data: [] as any[] }

  const completedProjects = myProjectsRes.data?.filter((p: any) => p.status === 'COMPLETED') ?? []
  const isCoverMemo = (memo: string) => (memo ?? '').includes('커버')

  const availableAmount = (pointHistoryRes.data ?? []).reduce((sum: number, ph: any) => {
    if (!ph.project_code) return sum + (ph.amount ?? 0)
    const project = completedProjects.find((p: any) => p.project_code.toLowerCase() === ph.project_code.toLowerCase())
    if (!project) return sum
    if (isCoverMemo(ph.memo)) {
      const endDate = project.end_date ? new Date(project.end_date) : null
      if (!endDate) return sum
      const coverDeadline = new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
      if (new Date() < coverDeadline) return sum
    }
    return sum + (ph.amount ?? 0)
  }, 0)

  const settledAmount = (settlementsRes.data ?? [])
    .filter((s: any) => ['PENDING', 'APPROVED'].includes(s.status))
    .reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0)

  return Math.max(0, availableAmount - settledAmount)
}
