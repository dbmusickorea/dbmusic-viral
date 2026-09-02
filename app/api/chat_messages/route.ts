import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const role = searchParams.get('role')
  if (!userId || !role) return NextResponse.json({ error: 'user_id, role 필요' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user_id, role, sender, body: messageBody, project_code, attachment_url, attachment_name, attachment_type, attachment_size } = body
  if (!user_id || !role || !sender || (!messageBody && !attachment_url)) {
    return NextResponse.json({ error: 'user_id, role, sender, (body 또는 attachment_url) 필요' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      user_id, role, sender,
      body: messageBody ?? '',
      project_code: project_code ?? null,
      attachment_url: attachment_url ?? null,
      attachment_name: attachment_name ?? null,
      attachment_type: attachment_type ?? null,
      attachment_size: attachment_size ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })

  // 푸시 알림 발송 (첨부파일만 보내고 본문이 비어있으면, 빈 본문으론 푸시가 발송 안 되므로 대체 문구 사용)
  const pushBody = messageBody || (attachment_type?.startsWith('image/') ? '사진을 보냈어요' : attachment_url ? `${attachment_name || '파일'}을 보냈어요` : messageBody)
  try {
    if (sender === 'admin') {
      // 관리자 -> 체험단/의뢰인
      const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token').eq('user_id', String(user_id))
      if (tokens && tokens.length > 0) {
        await fetch('https://app.doubleb.kr/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '💬 새 채팅 메시지가 왔어요',
            body: pushBody,
            data: { url: (role === 'client' ? '/client' : '/participant') + '?open_chat=1' },
            tokens: tokens.map((t: any) => t.token),
            userIds: [String(user_id)],
            skipNotificationSave: true
          })
        })
      }
    } else {
      // 체험단/의뢰인 -> 관리자
      const { data: adminUsers } = await supabaseAdmin.from('users').select('id').eq('role', 'admin')
      const adminIds = (adminUsers ?? []).map((u: any) => String(u.id))
      const { data: tokens } = await supabaseAdmin.from('push_tokens').select('token').in('user_id', adminIds)
      if (tokens && tokens.length > 0) {
        await fetch('https://app.doubleb.kr/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '💬 새 채팅 메시지가 왔어요',
            body: pushBody,
            data: { url: '/admin-chat' },
            tokens: tokens.map((t: any) => t.token),
            userIds: adminIds,
            skipNotificationSave: true
          })
        })
      }
    }
  } catch (e) {
    console.error('채팅 푸시 발송 실패:', e)
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { user_id, role, reader } = body
  if (!user_id || !role || !reader) return NextResponse.json({ error: 'user_id, role, reader 필요' }, { status: 400 })

  const otherSender = reader === 'admin' ? 'user' : 'admin'

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .eq('role', role)
    .eq('sender', otherSender)
    .is('read_at', null)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: msg } = await supabaseAdmin.from('chat_messages').select('attachment_url').eq('id', id).single()
  if (msg?.attachment_url) {
    const marker = '/chat-attachments/'
    const idx = msg.attachment_url.indexOf(marker)
    if (idx >= 0) {
      const path = msg.attachment_url.slice(idx + marker.length)
      await supabaseAdmin.storage.from('chat-attachments').remove([path])
    }
  }

  // 완전 삭제 대신 "삭제됨" 표시만 남김 (본문/첨부는 비움)
  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString(), body: '', attachment_url: null, attachment_type: null })
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
