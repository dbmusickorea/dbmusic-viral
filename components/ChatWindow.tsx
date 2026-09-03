'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { supabase } from '../app/lib/supabase'
import { Send, Check, CheckCheck, ArrowLeft, ChevronDown, Paperclip, X, FileText, Trash2, Download, Folder, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
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
  attachment_size?: number | null
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
  const [viewingImageIndex, setViewingImageIndex] = useState<number | null>(null)
  const [viewingMessageId, setViewingMessageId] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<Record<number, { received: number; total: number }>>({})
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null)
  const [audioSrc, setAudioSrc] = useState<Record<number, string>>({})
  const touchStartX = useRef<number | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryTab, setGalleryTab] = useState<'media' | 'files' | 'links'>('media')
  const [linkPreviews, setLinkPreviews] = useState<Record<string, { title: string; description?: string; image?: string; siteName?: string } | 'loading' | 'failed'>>({})
  const [cachedPaths, setCachedPaths] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return
    const checkCache = async () => {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Capacitor } = await import('@capacitor/core')
      const results: Record<number, string> = {}
      for (const m of messages) {
        if (!m.attachment_name) continue
        const path = `chat-cache/${m.id}_${m.attachment_name}`
        if (m.deleted_at) {
          // 상대방(또는 나)이 메시지를 지웠으면, 내 기기에 남아있는 캐시도 같이 정리
          try { await Filesystem.deleteFile({ path, directory: Directory.Cache }) } catch {}
          continue
        }
        try {
          // stat으로 실제 파일 존재 여부를 먼저 확인 (getUri는 존재 안 해도 성공해버림)
          await Filesystem.stat({ path, directory: Directory.Cache })
          const uriResult = await Filesystem.getUri({ path, directory: Directory.Cache })
          results[m.id] = Capacitor.convertFileSrc(uriResult.uri)
        } catch {}
      }
      setCachedPaths(results)
    }
    checkCache()
  }, [messages])

  useEffect(() => {
    const urls = new Set<string>()
    for (const m of messages) {
      if (!m.body || m.deleted_at) continue
      const found = m.body.match(URL_REGEX)
      found?.forEach((u) => urls.add(u))
    }
    urls.forEach((url) => {
      if (linkPreviews[url]) return
      setLinkPreviews((prev) => ({ ...prev, [url]: 'loading' }))
      fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => setLinkPreviews((prev) => ({ ...prev, [url]: data })))
        .catch(() => setLinkPreviews((prev) => ({ ...prev, [url]: 'failed' })))
    })
  }, [messages])
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

  const PREVIEWABLE_TYPES = [
    'application/pdf', 'text/plain',
    'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
  ]

  const handlePlayAudio = async (m: ChatMessage) => {
    if (playingAudioId === m.id) {
      setPlayingAudioId(null)
      return
    }
    if (audioSrc[m.id]) {
      setPlayingAudioId(m.id)
      return
    }
    const filename = m.attachment_name || 'audio'
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      const alreadyCached = await isAttachmentCached(m.id, filename)
      if (!alreadyCached) {
        setDownloadProgress((prev) => ({ ...prev, [m.id]: { received: 0, total: 0 } }))
        await cacheAttachment(m.id, m.attachment_url!, filename, (received, total) => {
          setDownloadProgress((prev) => ({ ...prev, [m.id]: { received, total } }))
        })
        setDownloadProgress((prev) => { const next = { ...prev }; delete next[m.id]; return next })
        await markAsCached(m.id, filename)
      }
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Capacitor } = await import('@capacitor/core')
      try {
        const uriResult = await Filesystem.getUri({ path: `chat-cache/${m.id}_${filename}`, directory: Directory.Cache })
        setAudioSrc((prev) => ({ ...prev, [m.id]: Capacitor.convertFileSrc(uriResult.uri) }))
      } catch {
        setAudioSrc((prev) => ({ ...prev, [m.id]: m.attachment_url! }))
      }
    } else {
      setAudioSrc((prev) => ({ ...prev, [m.id]: m.attachment_url! }))
    }
    setPlayingAudioId(m.id)
  }

  const handleOpenFile = async (messageId: number, url: string, filename: string, type?: string | null) => {
    const alreadyCached = await isAttachmentCached(messageId, filename)
    if (!alreadyCached && (window as any).Capacitor?.isNativePlatform?.()) {
      setDownloadProgress((prev) => ({ ...prev, [messageId]: { received: 0, total: 0 } }))
      await cacheAttachment(messageId, url, filename, (received, total) => {
        setDownloadProgress((prev) => ({ ...prev, [messageId]: { received, total } }))
      })
      setDownloadProgress((prev) => { const next = { ...prev }; delete next[messageId]; return next })
      await markAsCached(messageId, filename)
    }

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
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = reject
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')
        const written = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache })
        await Share.share({ files: [written.uri] })
      } catch {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url })
      }
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

  const isAttachmentCached = async (messageId: number, filename: string) => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return false
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      await Filesystem.stat({ path: `chat-cache/${messageId}_${filename}`, directory: Directory.Cache })
      return true
    } catch {
      return false
    }
  }

  const URL_REGEX = /(https?:\/\/[^\s]+)/g

  const openCachedFile = async (path: string) => {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: path })
    } else {
      window.open(path, '_blank')
    }
  }

  const openCachedFileNative = async (messageId: number, filename: string) => {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Share } = await import('@capacitor/share')
      const uriResult = await Filesystem.getUri({ path: `chat-cache/${messageId}_${filename}`, directory: Directory.Cache })
      await Share.share({ url: uriResult.uri })
    } catch (e) {
      console.log('캐시 파일 열기 실패:', e)
    }
  }

  const handleLinkClick = (url: string) => {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      window.open(url, '_system')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const renderMessageBody = (text: string, isMine: boolean) => {
    // split을 캡처그룹 정규식으로 하면, 홀수 인덱스가 매칭된 URL, 짝수 인덱스가 그 사이 일반 텍스트
    const parts = text.split(URL_REGEX)
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span
          key={i}
          onClick={(e) => { e.stopPropagation(); handleLinkClick(part) }}
          className={`underline cursor-pointer break-all ${isMine ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  const attachmentInfoText = (m: ChatMessage) => {
    const size = formatFileSize(m.attachment_size)
    const dateStr = new Date(new Date(m.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
    return size ? `${size} · ${dateStr}까지 다운로드 가능` : `${dateStr}까지 다운로드 가능`
  }

  const markAsCached = async (messageId: number, filename: string) => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const { Capacitor } = await import('@capacitor/core')
      const path = `chat-cache/${messageId}_${filename}`
      await Filesystem.stat({ path, directory: Directory.Cache })
      const uriResult = await Filesystem.getUri({ path, directory: Directory.Cache })
      setCachedPaths((prev) => ({ ...prev, [messageId]: Capacitor.convertFileSrc(uriResult.uri) }))
    } catch {}
  }

  const cacheAttachment = async (messageId: number, url: string, filename: string, onProgress?: (received: number, total: number) => void) => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const path = `chat-cache/${messageId}_${filename}`
      // 이미 캐시되어 있으면 다시 안 받음
      try {
        await Filesystem.stat({ path, directory: Directory.Cache })
        return
      } catch {}

      const res = await fetch(url)
      const total = Number(res.headers.get('content-length') || 0)
      const reader = res.body?.getReader()
      const chunks: Uint8Array[] = []
      let received = 0
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            chunks.push(value)
            received += value.length
            onProgress?.(received, total)
          }
        }
      }
      const blob = new Blob(chunks as BlobPart[])
      const base64Data = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onerror = reject
        fr.onload = () => resolve(fr.result as string)
        fr.readAsDataURL(blob)
      })
      await Filesystem.writeFile({ path, data: base64Data, directory: Directory.Cache, recursive: true })
    } catch (err) {
      console.log('첨부파일 캐시 실패:', err)
    }
  }

  const getViewableImages = () => messages.filter((m) => m.attachment_url && !m.deleted_at && m.attachment_type?.startsWith('image/'))

  const resolveImageSrc = (m: ChatMessage) => {
    const expired = Date.now() - new Date(m.created_at).getTime() > 7 * 24 * 60 * 60 * 1000
    return cachedPaths[m.id] ?? (expired ? null : m.attachment_url)
  }

  const openImageViewer = (messageId: number) => {
    const list = getViewableImages()
    const idx = list.findIndex((m) => m.id === messageId)
    if (idx === -1) return
    setViewingImageIndex(idx)
    setViewingMessageId(list[idx].id)
    setViewingImageUrl(resolveImageSrc(list[idx]))
  }

  const navigateImage = (direction: 1 | -1) => {
    const list = getViewableImages()
    if (viewingImageIndex === null) return
    const nextIndex = viewingImageIndex + direction
    if (nextIndex < 0 || nextIndex >= list.length) return
    setViewingImageIndex(nextIndex)
    setViewingMessageId(list[nextIndex].id)
    setViewingImageUrl(resolveImageSrc(list[nextIndex]))
  }

  const handleDownloadViewing = async () => {
    const msg = messages.find((m) => m.id === viewingMessageId)
    if (!msg?.attachment_url) return
    await handleDownload(msg.attachment_url, msg.attachment_name || 'image.jpg')
  }

  const handleImageClick = async (messageId: number, url: string, filename: string) => {
    cacheAttachment(messageId, url, filename).then(() => markAsCached(messageId, filename))
    openImageViewer(messageId)
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
      const sendRes = await fetchWithAuth('/api/chat_messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, role, sender: myLabel, body: '',
          attachment_url: publicUrl, attachment_name: file.name, attachment_type: file.type, attachment_size: file.size,
        })
      })
      const sentMsg = await sendRes.json()
      if (sentMsg?.id) cacheAttachment(sentMsg.id, publicUrl, file.name)
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
            <div className="min-w-0 flex-1">
              {title && <p className="font-bold dark:text-white truncate">{title}</p>}
              {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
            </div>
            <button onClick={() => setShowGallery(true)} className="text-gray-500 dark:text-gray-400 shrink-0">
              <Folder size={20} />
            </button>
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
                      cachedPaths[m.id] ? (
                        m.attachment_type?.startsWith('image/') ? (
                          <img src={cachedPaths[m.id]} className="rounded-2xl w-full max-w-[240px] object-cover mb-1" onClick={() => openImageViewer(m.id)} />
                        ) : (
                          <a href={cachedPaths[m.id]} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm mb-1 ${isMine ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 dark:text-white'}`}>
                            <FileText size={16} className="shrink-0" />
                            <span className="truncate">{m.attachment_name || '첨부파일'} (저장됨)</span>
                          </a>
                        )
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs mb-1 ${isMine ? 'bg-blue-500/60 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border dark:border-gray-600'}`}>
                          <FileText size={14} className="shrink-0" />
                          <span>파일 다운로드 기간(7일)이 지났습니다.</span>
                        </div>
                      )
                    ) : m.attachment_type?.startsWith('image/') ? (
                      <div className="mb-1 max-w-[240px]">
                        <div className="relative">
                          <button onClick={() => handleImageClick(m.id, m.attachment_url ?? '', m.attachment_name || 'image.jpg')} className="block">
                            <img src={m.attachment_url} className="rounded-2xl w-full object-cover" />
                          </button>
                          <button onClick={() => handleDownload(m.attachment_url!, m.attachment_name || 'image.jpg')} className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5">
                            <Download size={14} />
                          </button>
                        </div>
                        {!cachedPaths[m.id] && (
                          <p className={`text-[10px] mt-0.5 px-1 ${isMine ? 'text-blue-400' : 'text-gray-400'}`}>
                            {attachmentInfoText(m)}
                          </p>
                        )}
                      </div>
                    ) : downloadProgress[m.id] ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm mb-1 bg-gray-100 dark:bg-gray-700">
                        <FileText size={16} className="shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate dark:text-gray-300">{m.attachment_name}</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${downloadProgress[m.id].total ? Math.min(100, Math.round(downloadProgress[m.id].received / downloadProgress[m.id].total * 100)) : 0}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {(downloadProgress[m.id].received / 1024 / 1024).toFixed(1)}MB / {downloadProgress[m.id].total ? `${(downloadProgress[m.id].total / 1024 / 1024).toFixed(1)}MB` : '?'}
                            {downloadProgress[m.id].total > 0 && ` (${Math.round(downloadProgress[m.id].received / downloadProgress[m.id].total * 100)}%)`}
                          </p>
                        </div>
                      </div>
                    ) : m.attachment_type?.startsWith('audio/') ? (
                      <div className={`px-3 py-2 rounded-2xl text-sm mb-1 ${playingAudioId === m.id ? 'min-w-[300px] md:min-w-[340px]' : 'min-w-[220px]'} ${isMine ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 dark:text-white'}`}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handlePlayAudio(m)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-blue-500 text-white'}`}>
                              {playingAudioId === m.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate">{m.attachment_name || '음원 파일'}</p>
                              {!cachedPaths[m.id] && (
                                <p className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {attachmentInfoText(m)}
                                </p>
                              )}
                            </div>
                          </button>
                          <button onClick={() => handleDownload(m.attachment_url!, m.attachment_name || 'audio')} className="shrink-0">
                            <Download size={16} />
                          </button>
                        </div>
                        {playingAudioId === m.id && audioSrc[m.id] && (
                          <audio src={audioSrc[m.id]} controls autoPlay onEnded={() => setPlayingAudioId(null)} className="w-full mt-2 h-8" />
                        )}
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-sm mb-1 ${isMine ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 dark:text-white'}`}>
                        <button onClick={() => handleOpenFile(m.id, m.attachment_url!, m.attachment_name || 'file', m.attachment_type)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                          <FileText size={16} className="shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate">{m.attachment_name || '첨부파일'}</p>
                            {!cachedPaths[m.id] && (
                              <p className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                {attachmentInfoText(m)}
                              </p>
                            )}
                          </div>
                        </button>
                        <button onClick={() => handleDownload(m.attachment_url!, m.attachment_name || 'file')} className="shrink-0">
                          <Download size={16} />
                        </button>
                      </div>
                    )
                  )}
                  {m.body && (
                    <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-gray-700 dark:text-white rounded-bl-sm'}`}>
                      {renderMessageBody(m.body, isMine)}
                    </div>
                  )}
                  {m.body && m.body.match(URL_REGEX)?.[0] && (() => {
                    const url = m.body.match(URL_REGEX)![0]
                    const preview = linkPreviews[url]
                    if (!preview || preview === 'loading' || preview === 'failed') return null
                    return (
                      <button onClick={() => handleLinkClick(url)} className="block max-w-[260px] mt-1 rounded-xl overflow-hidden bg-white dark:bg-gray-800 text-left">
                        {preview.image && (
                          <img src={preview.image} className="w-full aspect-video object-cover" />
                        )}
                        <div className="p-2">
                          {preview.siteName && <p className="text-[10px] text-gray-400 truncate">{preview.siteName}</p>}
                          <p className="text-xs font-medium dark:text-white truncate">{preview.title}</p>
                          {preview.description && <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{preview.description}</p>}
                        </div>
                      </button>
                    )
                  })()}
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
            placeholder="메시지 입력..."
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



      {showGallery && (
        <div className="fixed inset-0 z-[75] bg-white dark:bg-gray-900 flex flex-col" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="border-b dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3 p-4 md:max-w-7xl md:mx-auto">
              <button onClick={() => setShowGallery(false)}><ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" /></button>
              <p className="font-bold dark:text-white">첨부파일 모아보기</p>
            </div>
          </div>

          <div className="w-full md:max-w-7xl md:mx-auto flex gap-2 p-3 shrink-0">
            <button onClick={() => setGalleryTab('media')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${galleryTab === 'media' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>사진/동영상</button>
            <button onClick={() => setGalleryTab('files')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${galleryTab === 'files' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>파일</button>
            <button onClick={() => setGalleryTab('links')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${galleryTab === 'links' ? 'bg-blue-600 text-white' : 'border dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>링크</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="w-full md:max-w-7xl md:mx-auto">
            {(() => {
              const attachments = messages.filter((m) => m.attachment_url && !m.deleted_at)
              const galleryImages = attachments.filter((m) => m.attachment_type?.startsWith('image/') || m.attachment_type?.startsWith('video/'))
              const galleryFiles = attachments.filter((m) => !m.attachment_type?.startsWith('image/') && !m.attachment_type?.startsWith('video/'))

              const galleryLinks = messages
                .filter((m) => m.body && !m.deleted_at)
                .flatMap((m) => {
                  const found = m.body.match(URL_REGEX)
                  return found ? found.map((url) => ({ url, message: m })) : []
                })
                .reverse()

              if (galleryTab === 'media') {
                if (galleryImages.length === 0) return <p className="text-center text-sm text-gray-400 py-12">아직 주고받은 사진/동영상이 없어요.</p>
                return (
                  <div className="grid grid-cols-3 gap-1">
                    {galleryImages.map((m) => {
                      const expired = Date.now() - new Date(m.created_at).getTime() > 7 * 24 * 60 * 60 * 1000
                      const src = cachedPaths[m.id] ?? (expired ? null : m.attachment_url)
                      return (
                        <button
                          key={m.id}
                          disabled={!src}
                          onClick={() => src && (cachedPaths[m.id] ? openImageViewer(m.id) : handleImageClick(m.id, m.attachment_url ?? '', m.attachment_name || 'image.jpg'))}
                          className="relative aspect-square"
                        >
                          {src ? (
                            <img src={src} className="w-full h-full object-cover rounded" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                              <span className="text-[9px] text-gray-400 text-center px-1">만료됨</span>
                            </div>
                          )}
                          <span className="absolute bottom-0.5 right-0.5 text-[9px] text-white bg-black/50 px-1 rounded">
                            {new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              }

              if (galleryTab === 'files') {
                if (galleryFiles.length === 0) return <p className="text-center text-sm text-gray-400 py-12">아직 주고받은 파일이 없어요.</p>
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {galleryFiles.map((m) => {
                      const expired = Date.now() - new Date(m.created_at).getTime() > 7 * 24 * 60 * 60 * 1000
                      const cached = cachedPaths[m.id]
                      const usable = cached || !expired
                      return (
                        <button
                          key={m.id}
                          disabled={!usable}
                          onClick={() => cached ? openCachedFileNative(m.id, m.attachment_name || 'file') : handleOpenFile(m.id, m.attachment_url ?? '', m.attachment_name || 'file', m.attachment_type)}
                          className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 disabled:opacity-40 text-left min-w-0"
                        >
                          <FileText size={18} className="shrink-0 text-gray-500" />
                          <div className="min-w-0">
                            <p className="text-xs dark:text-white truncate">{m.attachment_name || '첨부파일'}{!usable && ' (만료됨)'}</p>
                            {!cached && (
                              <p className="text-[9px] text-gray-400">{new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              }

              if (galleryLinks.length === 0) return <p className="text-center text-sm text-gray-400 py-12">아직 주고받은 링크가 없어요.</p>
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {galleryLinks.map(({ url, message: m }, i) => {
                    const preview = linkPreviews[url]
                    const hasPreview = preview && preview !== 'loading' && preview !== 'failed'
                    return (
                      <button key={`${m.id}_${i}`} onClick={() => handleLinkClick(url)} className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 text-left min-w-0">
                        {hasPreview && preview.image && (
                          <img src={preview.image} className="w-full aspect-video object-cover" />
                        )}
                        <div className="p-2 h-[68px] overflow-hidden">
                          {hasPreview && preview.siteName && <p className="text-[9px] text-gray-400 truncate">{preview.siteName}</p>}
                          <p className="text-xs font-medium dark:text-white line-clamp-2">{hasPreview ? preview.title : url}</p>
                          {hasPreview && preview.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">{preview.description}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
            </div>
          </div>
        </div>
      )}

      {viewingImageUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black flex items-center justify-center"
          onClick={() => { setViewingImageUrl(null); setViewingImageIndex(null) }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            if (delta > 60) navigateImage(-1)
            else if (delta < -60) navigateImage(1)
            touchStartX.current = null
          }}
        >
          <button onClick={() => { setViewingImageUrl(null); setViewingImageIndex(null) }} className="absolute right-4 text-white z-10" style={{top: 'max(1rem, env(safe-area-inset-top))'}}>
            <X size={28} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDownloadViewing() }} className="absolute left-4 text-white z-10" style={{top: 'max(1rem, env(safe-area-inset-top))'}}>
            <Download size={26} />
          </button>
          {viewingImageIndex !== null && viewingImageIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); navigateImage(-1) }} className="hidden md:flex absolute left-4 text-white z-10 items-center justify-center" style={{top: '50%', transform: 'translateY(-50%)'}}>
              <ChevronLeft size={32} />
            </button>
          )}
          {viewingImageIndex !== null && viewingImageIndex < getViewableImages().length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); navigateImage(1) }} className="hidden md:flex absolute right-4 text-white z-10 items-center justify-center" style={{top: '50%', transform: 'translateY(-50%)'}}>
              <ChevronRight size={32} />
            </button>
          )}
          <img
            src={viewingImageUrl}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const msg = messages.find((m) => m.id === viewingMessageId)
              if (msg?.attachment_url && e.currentTarget.src !== msg.attachment_url) {
                e.currentTarget.src = msg.attachment_url
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
