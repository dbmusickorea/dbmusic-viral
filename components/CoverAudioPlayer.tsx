'use client'

import { useState, useRef } from 'react'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'
import { Play, Pause, Download, Music } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

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
    const data = await res.json()
    if (!res.ok) {
      setMrLoading(false)
      setError(data.error ?? 'MR을 다운로드할 수 없어요')
      return
    }

    if (Capacitor.isNativePlatform()) {
      try {
        // 파일명은 서버 응답(JSON)에서 그대로 받아옴 (CORS로 헤더 접근 불가하므로)
        const fileName = data.fileName || `${projectCode}_MR.mp3`
        const fileRes = await fetch(data.url)
        const blob = await fileRes.blob()
        const base64Data: string = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        const written = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        })

        await Share.share({
          title: fileName,
          url: written.uri
        })
      } catch {
        setError('다운로드 중 문제가 발생했어요')
      } finally {
        setMrLoading(false)
      }
    } else {
      window.open(data.url, '_blank')
      setMrLoading(false)
    }
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
