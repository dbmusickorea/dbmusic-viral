import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAuth.auth.getUser(token)
  if (!user) return false
  const { data } = await supabaseAdmin.from('users').select('role').eq('email', user.email).single()
  return data?.role === 'admin'
}

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth(request)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const [participantsRes, settlementsRes, postsRes, projectsRes] = await Promise.all([
    supabaseAdmin.from('participants').select('id, balance, level, cover_reward').eq('is_deleted', false),
    supabaseAdmin.from('settlements').select('member_id, amount, status').in('status', ['PENDING', 'APPROVED']),
    supabaseAdmin.from('posts').select('member_id, project_code, is_cover'),
    supabaseAdmin.from('projects').select('project_code, status, reward_per_post, end_date').eq('status', 'COMPLETED')
  ])

  const participants = participantsRes.data ?? []
  const settlements = settlementsRes.data ?? []
  const posts = postsRes.data ?? []
  const completedProjects = projectsRes.data ?? []
  const completedCodes = completedProjects.map((p: any) => p.project_code.toLowerCase())
  const now = new Date()

  const totalBalance = participants.reduce((sum: number, p: any) => sum + (p.balance ?? 0), 0)

  const totalAvailable = participants.reduce((sum: number, p: any) => {
    const myPosts = posts.filter((post: any) => post.member_id === p.id)

    const availablePostsAmount = myPosts
      .filter((post: any) => completedCodes.includes(post.project_code?.toLowerCase()) && !post.is_cover)
      .reduce((s: number, post: any) => {
        const project = completedProjects.find((proj: any) => proj.project_code.toLowerCase() === post.project_code?.toLowerCase())
        const baseAmount = project?.reward_per_post ?? 0
        const level = p.level ?? 1
        const earnAmount = level === 50 ? 10000 : Math.min(2500 + (level - 1) * 150, 10000)
        return s + Math.min(baseAmount, earnAmount)
      }, 0)

    const coverAmount = myPosts
      .filter((post: any) => {
        const project = completedProjects.find((proj: any) => proj.project_code.toLowerCase() === post.project_code?.toLowerCase())
        if (!project || !post.is_cover) return false
        const endDate = project.end_date ? new Date(project.end_date) : null
        if (!endDate) return false
        return now >= new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)
      })
      .reduce((s: number) => s + (p.cover_reward ?? 0), 0)

    const settledAmount = settlements
      .filter((s: any) => s.member_id === p.id)
      .reduce((s2: number, s: any) => s2 + (s.amount ?? 0), 0)

    return sum + Math.max(0, availablePostsAmount + coverAmount - settledAmount)
  }, 0)

  return NextResponse.json({ totalBalance, totalAvailable })
}
