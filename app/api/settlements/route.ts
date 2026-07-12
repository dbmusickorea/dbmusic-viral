import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settlements')
    .select('*')
    .order('requested_at', { ascending: false })
  
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