'use client'

import { useState, useRef } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { Play, Pause, Download, Music } from 'lucide-react'

export default function CoverAudioPlayer({ projectCode, memberId, role, showMr = false }: { projectCode: string, memberId: number, role?: string, showMr?: boolean }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mrLoading, setMrLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayToggle = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
      return
    }
    setLoading(true)
    setError('')
    const res = await fetchWithAuth(`/api/cover-audio-url?project_code=${projectCode}&type=audio&member_id=${memberId}&role=${role ?? ''}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? '재생할 수 없어요')
      return
    }
    setAudioUrl(data.url)
    setTimeout(() => {
      audioRef.current?.play()
      setIsPlaying(true)
    }, 100)
  }

  const handleMrDownload = async () => {
    setMrLoading(true)
    setError('')
    const res = await fetchWithAuth(`/api/cover-audio-url?project_code=${projectCode}&type=mr&member_id=${memberId}&role=${role ?? ''}`)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'MR을 다운로드할 수 없어요')
      setMrLoading(false)
      return
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename\*=UTF-8''(.+)/)
    const fileName = match ? decodeURIComponent(match[1]) : 'MR.mp3'

    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
    setMrLoading(false)
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900 rounded-xl p-3" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center gap-2">
        <button onClick={handlePlayToggle} disabled={loading} className="w-9 h-9 shrink-0 bg-purple-600 text-white rounded-full flex items-center justify-center disabled:bg-gray-300">
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1"><Music size={12} /> 원곡 미리듣기</p>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          controlsList="nodownload noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          onEnded={() => setIsPlaying(false)}
          className="w-full mt-2 h-8"
        />
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {showMr && (
        <button onClick={handleMrDownload} disabled={mrLoading} className="w-full mt-2 text-xs bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-lg py-1.5 flex items-center justify-center gap-1 disabled:opacity-50">
          <Download size={12} /> {mrLoading ? '다운로드 중...' : 'MR 다운로드'}
        </button>
      )}
    </div>
  )
}
