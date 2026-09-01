'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import ChatWindow from '../../components/ChatWindow'
import AdminBottomNav from '../../components/AdminBottomNav'
import { MessageCircle, Plus, Search, X } from 'lucide-react'

type Thread = {
  user_id: string
  role: string
  name: string
  last_message: string
  last_sender: string
  last_created_at: string
  unread_count: number
}

function AdminChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Thread | null>(null)
  const [filter, setFilter] = useState<'all' | 'participant' | 'client'>('all')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatRole, setNewChatRole] = useState<'participant' | 'client'>('participant')
  const [allParticipants, setAllParticipants] = useState<any[]>([])
  const [allClients, setAllClients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [listSearchQuery, setListSearchQuery] = useState('')
  const [showListSearch, setShowListSearch] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchThreads()
    fetchAllUsers()
    pollRef.current = setInterval(fetchThreads, 15000)

    const openUserId = searchParams.get('open_user_id')
    const openRole = searchParams.get('open_role')
    const openName = searchParams.get('open_name')
    if (openUserId && openRole) {
      setSelected({
        user_id: openUserId,
        role: openRole,
        name: openName ?? '(이름 없음)',
        last_message: '', last_sender: '', last_created_at: new Date().toISOString(), unread_count: 0
      })
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const fetchAllUsers = async () => {
    const [pRes, uRes] = await Promise.all([
      fetchWithAuth('/api/participants'),
      fetchWithAuth('/api/users')
    ])
    const pData = await pRes.json()
    const uData = await uRes.json()
    setAllParticipants(Array.isArray(pData) ? pData : [])
    setAllClients(Array.isArray(uData) ? uData.filter((u: any) => u.role === 'client') : [])
  }

  const fetchThreads = async () => {
    const res = await fetchWithAuth('/api/chat_threads')
    const data = await res.json()
    setThreads(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const filtered = threads
    .filter(t => filter === 'all' || t.role === filter)
    .filter(t => t.name.toLowerCase().includes(listSearchQuery.toLowerCase()))

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  const newChatList = (newChatRole === 'participant' ? allParticipants : allClients)
    .filter((u: any) => (u.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => (a.name ?? '').localeCompare(b.name ?? '', 'ko'))

  const openNewChat = (u: any) => {
    setSelected({
      user_id: String(u.id),
      role: newChatRole,
      name: u.name ?? '(이름 없음)',
      last_message: '', last_sender: '', last_created_at: new Date().toISOString(), unread_count: 0
    })
    setShowNewChat(false)
  }

  const newChatModal = showNewChat && (
    <div className="fixed inset-0 z-50 md:bg-black/40 md:flex md:items-center md:justify-center" style={{paddingTop: 'max(0px, env(safe-area-inset-top))'}}>
      <div className="h-full md:h-[70vh] md:w-full md:max-w-md bg-gray-50 dark:bg-gray-900 md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 md:rounded-t-2xl">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
            <button onClick={() => setShowNewChat(false)} className="text-gray-600 dark:text-gray-300">
              <X size={20} />
            </button>
            <p className="font-bold dark:text-white">새 대화 시작</p>
          </div>
        </div>
        <div className="max-w-2xl md:max-w-none w-full mx-auto p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setNewChatRole('participant')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${newChatRole === 'participant' ? 'bg-green-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>체험단</button>
            <button onClick={() => setNewChatRole('client')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${newChatRole === 'client' ? 'bg-purple-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>의뢰인</button>
          </div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 검색..."
              className="w-full border dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {newChatList.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">검색 결과가 없어요.</p>
            ) : newChatList.map((u: any) => (
              <button key={u.id} onClick={() => openNewChat(u)} className="w-full text-left px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                <p className="text-sm font-medium dark:text-white">{u.name ?? '(이름 없음)'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const listColumn = (
    <div className={`${selected ? 'hidden md:flex' : 'flex'} md:w-96 md:shrink-0 flex-col md:h-screen`}>
      <div style={{paddingTop: 'env(safe-area-inset-top)'}} />
      <div className="flex-1 md:overflow-y-auto p-4 pb-24 md:pb-4 max-w-2xl md:max-w-none w-full mx-auto md:mx-0 md:border-r md:border-gray-100 md:dark:border-gray-700">
        <div className="flex justify-center mb-4">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
        </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2"><MessageCircle size={20} /> 채팅</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowListSearch(!showListSearch); if (showListSearch) setListSearchQuery('') }} className="text-gray-500 dark:text-gray-400 p-2">
              <Search size={18} />
            </button>
            <button onClick={() => { setShowNewChat(true); setSearchQuery('') }} className="bg-blue-600 text-white rounded-full p-2">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setFilter('all')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>전체</button>
          <button onClick={() => setFilter('client')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'client' ? 'bg-purple-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>의뢰인</button>
          <button onClick={() => setFilter('participant')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === 'participant' ? 'bg-green-600 text-white' : 'border text-gray-500 dark:border-gray-600'}`}>체험단</button>
        </div>

        {showListSearch && (
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={listSearchQuery}
              onChange={(e) => setListSearchQuery(e.target.value)}
              placeholder="이름 검색..."
              className="w-full border dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">대화 내역이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <button
                key={`${t.role}_${t.user_id}`}
                onClick={() => setSelected(t)}
                className={`w-full rounded-2xl shadow p-4 flex items-center gap-3 text-left ${selected?.user_id === t.user_id && selected?.role === t.role ? 'bg-blue-50 dark:bg-gray-700 ring-1 ring-blue-300 dark:ring-blue-500' : 'bg-white dark:bg-gray-800'}`}
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
      <div className="md:hidden">
        <AdminBottomNav active="chat" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen md:h-screen bg-gray-50 dark:bg-gray-900">
      <div className="md:max-w-7xl md:w-full md:mx-auto md:h-full md:flex md:overflow-hidden">
        {listColumn}

        {!selected && (
          <div className="hidden md:flex md:flex-1 md:h-full items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">왼쪽에서 대화를 선택해주세요</p>
            </div>
          </div>
        )}

        {selected && (
          <div className="md:flex-1 md:h-full">
            <ChatWindow
              userId={selected.user_id}
              role={selected.role as 'participant' | 'client'}
              viewerType="admin"
              title={selected.name}
              subtitle={selected.role === 'participant' ? '체험단' : '의뢰인'}
              onBack={() => { setSelected(null); fetchThreads() }}
            />
          </div>
        )}
      </div>
      {newChatModal}
    </div>
  )
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
      <AdminChatContent />
    </Suspense>
  )
}
