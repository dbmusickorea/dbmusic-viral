import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')
  const projectCode = searchParams.get('project_code')
  const codes = searchParams.get('codes')

  let query = supabaseAdmin.from('projects').select('*').order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (status) {
    const statuses = status.split(',')
    if (statuses.length > 1) {
      query = query.in('status', statuses)
    } else {
      query = query.eq('status', status)
    }
  }
  if (projectCode) query = query.ilike('project_code', projectCode)
  if (codes) query = query.in('project_code', codes.split(','))
  const prefix = searchParams.get('prefix')
  if (prefix) query = query.ilike('project_code', `${prefix}_%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })

  if (data && data.length > 0) {
    const projectCodes = data.map((p: any) => p.project_code)
    const { data: participantCounts } = await supabaseAdmin
      .from('project_participants')
      .select('project_code')
      .in('project_code', projectCodes)
      .eq('status', 'ACTIVE')
    
    const countMap: any = {}
    participantCounts?.forEach((p: any) => {
      countMap[p.project_code] = (countMap[p.project_code] ?? 0) + 1
    })

    const merged = data.map((p: any) => ({
      ...p,
      current_participants: countMap[p.project_code] ?? 0
    }))
    return NextResponse.json(merged)
  }

  return NextResponse.json(data ?? [])
}
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(body)
    .eq('project_code', projectCode!)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert(body)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectCode = searchParams.get('project_code')

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('project_code', projectCode!)
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}