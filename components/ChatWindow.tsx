'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { supabase } from '../app/lib/supabase'
import { Send, Check, CheckCheck, ArrowLeft, ChevronDown } from 'lucide-react'
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard'

type ChatMessage = {
  id: number
  user_id: string
  role: string
  sender: 'admin' | 'user'
  body: string
  created_at: string
  read_at: string | null
}

type Props = {
  userId: string
  role: 'participant' | 'client'
  viewerType: 'admin' | 'user'
  title?: string
  subtitle?: string
  onBack?: () => void
}

export default function ChatWindow({ userId, role, viewerType, title, subtitle, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const myLabel = viewerType === 'admin' ? 'admin' : 'user'

  const fetchMessages = useCallback(async () => {
    const res = await fetchWithAuth(`/api/chat_messages?user_id=${userId}&role=${role}`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [userId, role])

  const markRead = useCallback(async () => {
    await fetchWithAuth('/api/chat_messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role, reader: myLabel })
    })
    // 앱 아이콘 뱃지 즉시 갱신 (읽음 처리 후 최신 정확한 숫자로)
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      try {
        let badgeUserId = userId
        let badgeRole: string = role
        if (myLabel === 'admin') {
          const info = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
          badgeUserId = String(info.id ?? userId)
          badgeRole = 'admin'
        }
        const res = await fetch(`/api/badge-count?user_id=${badgeUserId}&role=${badgeRole}`)
        const { count } = await res.json()
        const { Badge } = await import('@capawesome/capacitor-badge')
        if (count > 0) await Badge.set({ count })
        else await Badge.clear()
      } catch (e) {}
    }
  }, [userId, role, myLabel])

  useEffect(() => {
    fetchMessages().then(() => markRead())
  }, [fetchMessages, markRead])

  useEffect(() => {
    const channel = supabase
      .channel(`chat_${role}_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if ((payload.new as any)?.role !== role && (payload.old as any)?.role !== role) return
        fetchMessages().then(() => markRead())
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, role, fetchMessages, markRead])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 150) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollButton(distanceFromBottom > 200)
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return
    const applyKeyboardStyle = () => {
      const isDark = document.documentElement.classList.contains('dark')
      Keyboard.setStyle({ style: isDark ? KeyboardStyle.Dark : KeyboardStyle.Light }).catch(() => {})
    }
    applyKeyboardStyle()
    const observer = new MutationObserver(applyKeyboardStyle)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      // 레이아웃 뷰포트(window.innerHeight)보다 시각 뷰포트(visualViewport.height)가
      // 눈에 띄게 작아지면 키보드가 열린 것으로 판단 (브라우저/Capacitor 공통으로 동작)
      const diff = window.innerHeight - vv.height
      setKeyboardVisible(diff > 100)
      // 키보드가 열리면서 화면이 줄어들 때도 "최신 메시지로 이동" 버튼 표시 여부 재계산
      setTimeout(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        setShowScrollButton(distanceFromBottom > 200)
      }, 50)
    }
    vv.addEventListener('resize', handleResize)
    handleResize()
    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const body = input.trim()
    setInput('')
    await fetchWithAuth('/api/chat_messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role, sender: myLabel, body })
    })
    await fetchMessages()
    setSending(false)
    // 내가 보낸 메시지는 스크롤 위치와 상관없이 항상 최신으로 이동
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="fixed md:static top-0 left-0 right-0 z-[60] md:z-0 flex flex-col items-center bg-gray-50 dark:bg-gray-900 h-[100dvh] md:h-full w-full">
      <div className="w-full shrink-0" style={{paddingTop: 'env(safe-area-inset-top)'}} />
      {(title || onBack) && (
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="max-w-2xl md:max-w-none mx-auto flex items-center gap-3 px-4 py-3">
            {onBack && (
              <button onClick={onBack} className="text-gray-600 dark:text-gray-300">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              {title && <p className="font-bold dark:text-white truncate">{title}</p>}
              {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 w-full max-w-2xl md:max-w-none mx-auto overflow-hidden flex flex-col">
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8">아직 대화가 없어요.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender === myLabel
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 dark:text-white rounded-bl-sm'}`}>
                    {m.body}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    {isMine && (m.read_at ? <CheckCheck size={11} className="text-blue-400" /> : <Check size={11} className="text-gray-300" />)}
                    <span className="text-[10px] text-gray-400">
                      {new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      {showScrollButton && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10"
        >
          <ChevronDown size={20} />
        </button>
      )}
      </div>

      <div className="w-full shrink-0 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800" style={{paddingBottom: keyboardVisible ? '0.75rem' : 'max(0.75rem, env(safe-area-inset-bottom))'}}>
        <div className="max-w-2xl md:max-w-none mx-auto flex gap-2 p-3 pb-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend() }}
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm dark:text-white"
            placeholder="메시지 입력..."
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            inputMode="text"
            name="msg-body-nofill"
            data-lpignore="true"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
