'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useSearchParams } from 'next/navigation'

export default function ClientMyPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [myName, setMyName] = useState('')
  const [myCompany, setMyCompany] = useState('')
  const [myArtist, setMyArtist] = useState('')
  const [myPhone, setMyPhone] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [requestTitle, setRequestTitle] = useState('')
  const [requestContent, setRequestContent] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestedPosts, setRequestedPosts] = useState('1')
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setMyName(parsed.name ?? '')
    setMyCompany(parsed.company ?? '')
    setMyArtist(parsed.artist ?? '')
    setMyPhone(parsed.phone ?? '')
    setMyMobile(parsed.mobile ?? '')

    const loadData = async () => {
      if (parsed.client_id) {
        const reqRes = await fetch(`/api/client_requests?client_id=${parsed.client_id}`)
        const reqData = await reqRes.json()
        setRequests(reqData ?? [])
      }
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const info = localStorage.getItem('userInfo')
    if (info) {
      const parsed = JSON.parse(info)
      const reqRes = await fetch(`/api/client_requests?client_id=${parsed.client_id}`)
      setRequests(await reqRes.json())
    }
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleUpdateMyInfo = async () => {
    if (myPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userInfo?.email,
        password: myCurrentPassword
      })
      if (authError) { alert('기존 비밀번호가 틀렸어요.'); return }
      await supabase.auth.updateUser({ password: myPassword })
    }
    const updateData: any = {
      name: myName, company: myCompany, artist: myArtist,
      phone: myPhone, mobile: myMobile
    }
    const res = await fetch(`/api/users?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { alert('수정 실패!'); return }
    const updated = { ...userInfo, ...updateData }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    alert('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
    setIsEditing(false)
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { alert('제목과 내용을 입력해주세요.'); return }
    const res = await fetch('/api/client_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: userInfo?.client_id,
        client_name: userInfo?.name,
        client_mobile: userInfo?.mobile,
        title: requestTitle,
        content: requestContent,
        requested_posts: Number(requestedPosts)
      })
    })
    if (!res.ok) { alert('등록 실패!'); return }
    alert('✅ 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    const reqRes = await fetch(`/api/client_requests?client_id=${userInfo?.client_id}`)
    setRequests(await reqRes.json())
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/client') },
          { icon: '📊', label: '현황', onClick: () => router.push('/client#stats') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/client-mypage'), active: true },
        ]}
      />
      <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        } else {
          setPullStartY(0)
        }
      }}
      onTouchMove={(e) => {
        if (pullStartY === 0) return
        const pullDistance = e.touches[0].clientY - pullStartY
        if (pullDistance > 70) setIsPulling(true)
      }}
      onTouchEnd={() => {
        if (isPulling) handleRefresh()
        setIsPulling(false)
      }}
    >
      <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
        {(isPulling || isRefreshing) && (
          <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
            {isRefreshing ? (
              <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
            ) : (
              <><ArrowDown size={14} /> 놓으면 새로고침</>
            )}
          </div>
        )}
        <div className="max-w-lg mx-auto flex items-center gap-3">
          
          <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto">

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">👤 내 정보</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5">정보 수정</button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium">{userInfo?.email ?? '-'}</p>
              </div>
              {[
                { label: '이름', value: myName },
                { label: '회사명', value: myCompany },
                { label: '아티스트명', value: myArtist },
                { label: '전화번호', value: myPhone },
                { label: '휴대전화', value: myMobile },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium">{value || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">이메일 (변경 불가)</p>
                <p className="text-sm font-medium">{userInfo?.email ?? '-'}</p>
              </div>
              {[
                { label: '이름', value: myName, setter: setMyName },
                { label: '회사명', value: myCompany, setter: setMyCompany },
                { label: '아티스트명', value: myArtist, setter: setMyArtist },
                { label: '전화번호', value: myPhone, setter: setMyPhone },
                { label: '휴대전화', value: myMobile, setter: setMyMobile },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-sm font-medium">{label}</label>
                  <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium">기존 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="비밀번호 변경시만" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">새 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="새 비밀번호 변경시만" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleUpdateMyInfo} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">저장하기</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2 mb-3">로그아웃</button>
          <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full text-xs text-red-400 text-center py-1">계정 삭제</button>
          {showDeleteConfirm && (
            <div className="mt-3 border border-red-300 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ 계정 삭제 확인</p>
              <p className="text-xs text-gray-600 mb-3">삭제 후 복구가 불가능합니다.</p>
              <p className="text-xs font-medium mb-1">아래에 <span className="text-red-600 font-bold">"탈퇴합니다"</span>를 입력해주세요:</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3" placeholder="탈퇴합니다" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                <button disabled={deleteConfirmText !== '탈퇴합니다'} onClick={async () => {
                  await fetch(`/api/users?id=${userInfo?.id}`, { method: 'DELETE' })
                  await supabase.auth.signOut()
                  localStorage.removeItem('userInfo')
                  localStorage.removeItem('userRole')
                  alert('계정이 삭제됐습니다.')
                  router.push('/')
                }} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-300">삭제 확인</button>
              </div>
            </div>
          )}
        </div>
        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500 font-medium mb-2">더블비뮤직 · 대표: 최병민 · 사업자등록번호: 280-02-02331</p>
          <p className="text-xs text-gray-400 mb-1">서울특별시 송파구 백제고분로 116, 3층 611호</p>
          <p className="text-xs text-gray-400 mb-1">고객센터: 010-7593-7966</p>
          <p className="text-xs text-gray-400 mb-3">제휴 및 광고 문의: db.music.korea@gmail.com</p>
          <p className="text-xs text-gray-300">COPYRIGHT 2026. 더블비뮤직 ALL RIGHTS RESERVED.</p>
        </div>
      </div>
      <BottomNav tabs={[
        { icon: '📋', label: '프로젝트', href: '/client' },
        { icon: '📊', label: '현황', href: '/client' },
        { icon: '👤', label: '마이페이지', href: '/client-mypage', active: true },
      ]} />
    </div>
    </>
  )
}