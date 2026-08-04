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

async function getRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseAuth.auth.getUser(token)
  if (!user) return null
  const { data: userData } = await supabaseAdmin.from('users').select('role').eq('email', user.email).single()
  if (userData) return { role: userData.role, email: user.email }
  const { data: participant } = await supabaseAdmin.from('participants').select('id, email').eq('email', user.email).single()
  if (participant) return { role: 'participant', email: user.email, id: participant.id }
  return null
}

export async function GET(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')

  let query = supabaseAdmin
    .from('settlements')
    .select('*')
    .order('requested_at', { ascending: false })

  // 체험단은 본인 정산만
  if (roleInfo.role === 'participant') {
    query = query.eq('member_id', roleInfo.id)
  } else if (memberId) {
    query = query.eq('member_id', memberId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error }, { status: 500 })

  if (data && data.length > 0) {
    const memberIds = data.map((s: any) => s.member_id)
    const { data: participantData } = await supabaseAdmin
      .from('participants')
      .select('id, name')
      .in('id', memberIds)
    const merged = data.map((s: any) => ({
      ...s,
      participants: participantData?.find((p: any) => p.id === s.member_id)
    }))
    return NextResponse.json(merged)
  }

  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabaseAdmin.from('settlements').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo || roleInfo.role === 'participant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const body = await request.json()
  const { error } = await supabaseAdmin.from('settlements').update(body).eq('id', id!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const roleInfo = await getRole(request)
  if (!roleInfo || roleInfo.role === 'participant') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('member_id')
  const { error } = await supabaseAdmin.from('settlements').delete().eq('member_id', memberId!)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
