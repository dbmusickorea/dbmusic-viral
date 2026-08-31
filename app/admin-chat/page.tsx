'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import ChatWindow from '../../components/ChatWindow'
import AdminBottomNav from '../../components/AdminBottomNav'
import { ArrowLeft, MessageCircle } from 'lucide-react'

type Thread = {
  user_id: string
  role: string
  name: string
  last_message: string
  last_sender: string
  last_created_at: string
  unread_count: number
}

export default function AdminChatPage() {
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Thread | null>(null)
  const [filter, setFilter] = useState<'all' | 'participant' | 'client'>('all')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchThreads()
    pollRef.current = setInterval(fetchThreads, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const fetchThreads = async () => {
    const res = await fetchWithAuth('/api/chat_threads')
    const data = await res.json()
    setThreads(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filtered = threads.filter(t => filter === 'all' || t.role === filter)

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col" style={{paddingTop: 'max(0px, env(safe-area-inset-top))'}}>
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shrink-0">
          <button onClick={() => { setSelected(null); fetchThreads() }} className="text-gray-600 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="font-bold dark:text-white">{selected.name}</p>
            <p className="text-xs text-gray-400">{selected.role === 'participant' ? '체험단' : '의뢰인'}</p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
          <ChatWindow userId={selected.user_id} role={selected.role as 'participant' | 'client'} viewerType="admin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <div className="flex justify-center mb-4">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
        </div>
        <h1 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><MessageCircle size={20} /> 채팅</h1>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setFilter('all')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>전체</button>
          <button onClick={() => setFilter('client')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'client' ? 'bg-purple-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>의뢰인</button>
          <button onClick={() => setFilter('participant')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'participant' ? 'bg-green-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>체험단</button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">대화 내역이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <button
                key={`${t.role}_${t.user_id}`}
                onClick={() => setSelected(t)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium dark:text-white truncate">{t.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${t.role === 'participant' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {t.role === 'participant' ? '체험단' : '의뢰인'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {t.last_sender === 'admin' ? '나: ' : ''}{t.last_message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-gray-300">
                    {new Date(t.last_created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                  </span>
                  {t.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{t.unread_count}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <AdminBottomNav />
    </div>
  )
}
