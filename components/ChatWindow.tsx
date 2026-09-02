'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { supabase } from '../app/lib/supabase'
import { Send, Check, CheckCheck, ArrowLeft, ChevronDown, Paperclip, X, FileText, Trash2, Download } from 'lucide-react'
import { Keyboard, KeyboardStyle } from '@capacitor/keyboard'

type ChatMessage = {
  id: number
  user_id: string
  role: string
  sender: 'admin' | 'user'
  body: string
  created_at: string
  read_at: string | null
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  deleted_at?: string | null
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
    fetchMessages().then(() => {
      markRead()
      // 대화를 새로 열었을 때는 항상(스크롤 위치 무관) 즉시 최신 메시지로 이동
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50)
    })
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

  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const dragCounter = useRef(0)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  const resizeImage = (file: File, maxSize: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > height && width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize }
        else if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas 실패')); return }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('압축 실패')), 'image/jpeg', quality)
      }
      img.onerror = reject
      img.src = url
    })
  }

  const [contextMenuMsgId, setContextMenuMsgId] = useState<number | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLongPress = (msgId: number) => {
    longPressTimer.current = setTimeout(() => setContextMenuMsgId(msgId), 500)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleDeleteMessage = async (msgId: number) => {
    setContextMenuMsgId(null)
    if (!confirm('이 메시지를 삭제하시겠어요?')) return
    await fetchWithAuth(`/api/chat_messages?id=${msgId}`, { method: 'DELETE' })
    await fetchMessages()
  }

  const PREVIEWABLE_TYPES = ['application/pdf', 'text/plain']

  const handleOpenFile = async (url: string, type?: string | null) => {
    if (!type || !PREVIEWABLE_TYPES.includes(type)) {
      alert('미리보기를 지원하지 않는 파일입니다.')
      return
    }
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } else {
      window.open(url, '_blank')
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      const { Share } = await import('@capacitor/share')
      await Share.share({ url })
    } else {
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        window.open(url, '_blank')
      }
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.size > 50 * 1024 * 1024) {
      alert('50MB보다 큰 파일은 보낼 수 없어요.')
      return
    }
    if (uploadingAttachment) return
    setUploadingAttachment(true)

    // 서버(Vercel)를 거치지 않고 저장소로 직접 업로드 - 용량 제한 없음
    const signRes = await fetchWithAuth('/api/chat-attachment-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: file.name })
    })
    const { path, token, publicUrl } = await signRes.json()

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .uploadToSignedUrl(path, token, file, { contentType: file.type })

    if (!uploadError) {
      await fetchWithAuth('/api/chat_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, role, sender: myLabel, body: '',
          attachment_url: publicUrl, attachment_name: file.name, attachment_type: file.type,
        })
      })
      await fetchMessages()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    setUploadingAttachment(false)
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

      <div
        className="relative flex-1 w-full max-w-2xl md:max-w-none mx-auto overflow-hidden flex flex-col"
        onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; setIsDraggingFile(true) }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current <= 0) setIsDraggingFile(false) }}
        onDrop={(e) => {
          e.preventDefault()
          dragCounter.current = 0
          setIsDraggingFile(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFileSelect(f)
        }}
      >
        {isDraggingFile && (
          <div className="absolute inset-0 z-20 bg-blue-500/10 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
            <p className="text-blue-600 font-medium bg-white dark:bg-gray-800 px-4 py-2 rounded-lg">여기에 파일을 놓으세요</p>
          </div>
        )}
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
                <div
                  className={`relative max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'} select-none`}
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                  onContextMenu={(e) => { if (isMine && !m.deleted_at) { e.preventDefault(); setContextMenuMsgId(m.id) } }}
                  onTouchStart={() => { if (isMine && !m.deleted_at) startLongPress(m.id) }}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  {contextMenuMsgId === m.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setContextMenuMsgId(null)} />
                      <div className={`absolute z-50 top-0 ${isMine ? 'right-full mr-1' : 'left-full ml-1'} bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden`}>
                        <button onClick={() => handleDeleteMessage(m.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 whitespace-nowrap">
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    </>
                  )}
                  {m.deleted_at ? (
                    <div className="px-3 py-2 rounded-2xl text-xs italic text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700">
                      메시지가 삭제되었습니다.
                    </div>
                  ) : (
                    <>
                  {m.attachment_url && (
                    (Date.now() - new Date(m.created_at).getTime() > 7 * 24 * 60 * 60 * 1000) ? (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs mb-1 ${isMine ? 'bg-blue-500/60 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border dark:border-gray-600'}`}>
                        <FileText size={14} className="shrink-0" />
                        <span>파일 다운로드 기간(7일)이 지났습니다.</span>
                      </div>
                    ) : m.attachment_type?.startsWith('image/') ? (
                      <div className="relative mb-1 max-w-[240px]">
                        <button onClick={() => setViewingImageUrl(m.attachment_url ?? null)} className="block">
                          <img src={m.attachment_url} className="rounded-2xl w-full object-cover" />
                        </button>
                        <button onClick={() => handleDownload(m.attachment_url!, m.attachment_name || 'image.jpg')} className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5">
                          <Download size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm mb-1 ${isMine ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 dark:text-white border dark:border-gray-600'}`}>
                        <button onClick={() => handleOpenFile(m.attachment_url!, m.attachment_type)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                          <FileText size={16} className="shrink-0" />
                          <span className="truncate">{m.attachment_name || '첨부파일'}</span>
                        </button>
                        <button onClick={() => handleDownload(m.attachment_url!, m.attachment_name || 'file')} className="shrink-0">
                          <Download size={16} />
                        </button>
                      </div>
                    )
                  )}
                  {m.body && (
                    <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 dark:text-white rounded-bl-sm'}`}>
                      {m.body}
                    </div>
                  )}
                    </>
                  )}
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
          <label className="text-gray-400 dark:text-gray-500 w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer">
            <Paperclip size={20} />
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = '' }} />
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() } }}
            rows={1}
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 text-sm dark:text-white resize-none max-h-32 leading-normal"
            placeholder="메시지 입력... (Shift+Enter로 줄바꿈)"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            inputMode="text"
            name="msg-body-nofill"
            data-lpignore="true"
            onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px' }}
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



      {viewingImageUrl && (
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center" onClick={() => setViewingImageUrl(null)}>
          <button onClick={() => setViewingImageUrl(null)} className="absolute top-4 right-4 text-white z-10" style={{top: 'max(1rem, env(safe-area-inset-top))'}}>
            <X size={28} />
          </button>
          <img src={viewingImageUrl} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
