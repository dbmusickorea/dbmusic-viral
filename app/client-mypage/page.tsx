'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LayoutGrid, BarChart2, User, FileText } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastContext'

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
  const [artistList, setArtistList] = useState<any[]>([])
  const [newArtistName, setNewArtistName] = useState('')
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
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyArtistName, setApplyArtistName] = useState('')
  const [applySongTitle, setApplySongTitle] = useState('')
  const [applyMissionDate, setApplyMissionDate] = useState('')
  const [applyHasCover, setApplyHasCover] = useState(false)
  const [applyCoverCount, setApplyCoverCount] = useState(0)
  const [applyRequirements, setApplyRequirements] = useState('')
  const { showToast } = useToast()
  const [appVersion, setAppVersion] = useState('0')
  const [minVersion, setMinVersion] = useState('0')

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

    if ((window as any).Capacitor?.isNativePlatform?.()) {
      import('@capacitor/app').then(({ App }) => {
        App.getInfo().then(async info => {
          setAppVersion(info.version)
          const { Capacitor } = await import('@capacitor/core')
          const platform = Capacitor.getPlatform()
          const res = await fetch(`/api/app_settings?key=min_version_${platform}`)
          const data = await res.json()
          setMinVersion(data?.value ?? '0')
        })
      }).catch(() => {})
    }

    const loadData = async () => {
      if (parsed.client_id) {
        const reqRes = await fetch(`/api/client_requests?client_id=${parsed.client_id}`)
        const reqData = await reqRes.json()
        setRequests(reqData ?? [])
        
        const artistRes = await fetch(`/api/artists?client_id=${parsed.client_id}`)
        setArtistList(await artistRes.json())
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
      if (authError) { showToast('기존 비밀번호가 틀렸어요.'); return }
      await supabase.auth.updateUser({ password: myPassword })
    }
    const updateData: any = {
      name: myName, company: myCompany, artist: myArtist,
      mobile: myMobile
    }
    const res = await fetch(`/api/users?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { showToast('수정 실패!'); return }
    const updated = { ...userInfo, ...updateData }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    setUserInfo(updated)
    showToast('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
    setIsEditing(false)
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { showToast('제목과 내용을 입력해주세요.'); return }
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
    if (!res.ok) { showToast('등록 실패!'); return }
    showToast('✅ 문의가 등록됐어요!')
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
    {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">📝 프로젝트 신청</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">가수명/아티스트명</label>
                <input value={applyArtistName} onChange={(e) => setApplyArtistName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="가수명 또는 아티스트명 입력" />
              </div>
              <div>
                <label className="text-sm font-medium">노래 제목</label>
                <input value={applySongTitle} onChange={(e) => setApplySongTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="노래 제목 입력" />
              </div>
              <div>
                <label className="text-sm font-medium">희망 미션 시작일</label>
                <input type="date" value={applyMissionDate} onChange={(e) => setApplyMissionDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={applyHasCover} onChange={(e) => setApplyHasCover(e.target.checked)} />
                  커버 옵션 추가
                </label>
                {applyHasCover && (
                  <div className="mt-2">
                    <label className="text-sm font-medium">커버 인원</label>
                    <input type="number" value={applyCoverCount} onChange={(e) => setApplyCoverCount(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="커버 인원 수 입력" min={1} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">요청사항</label>
                <textarea value={applyRequirements} onChange={(e) => setApplyRequirements(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={4} placeholder="요청사항 입력" />
              </div>
              <button onClick={async () => {
                if (!applyArtistName || !applySongTitle) { alert('가수명과 노래 제목을 입력해주세요.'); return }
                await fetch('/api/project_applications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    client_id: userInfo?.client_id,
                    client_name: userInfo?.name,
                    artist_name: applyArtistName,
                    song_title: applySongTitle,
                    mission_date: applyMissionDate,
                    has_cover: applyHasCover,
                    cover_count: applyCoverCount,
                    requirements: applyRequirements,
                    status: 'PENDING'
                  })
                })
                alert('프로젝트 신청이 완료됐어요!')
                setShowApplyModal(false)
                setApplyArtistName('')
                setApplySongTitle('')
                setApplyMissionDate('')
                setApplyHasCover(false)
                setApplyCoverCount(0)
                setApplyRequirements('')
              }} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">신청하기</button>
            </div>
          </div>
        </div>
      )}
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/client') },
          { icon: '📊', label: '현황', onClick: () => { 
            console.log('현황 버튼 클릭')
            sessionStorage.setItem('clientTab', 'stats')
            console.log('sessionStorage set:', sessionStorage.getItem('clientTab'))
            router.push('/client') 
          }},
          { icon: '📝', label: '신청', onClick: () => { setShowApplyModal(true); setShowSidebar(false) }},
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
        <div className="flex justify-center mb-2">
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer" onClick={() => router.push('/client')} />
        </div>
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
                { label: '휴대전화', value: myMobile },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="text-sm font-medium">{label}</label>
                  <p className="w-full border rounded-lg px-3 py-2 text-sm mt-1 bg-gray-50">{value}</p>
                </div>
              ))}
              <div>
                <label className="text-sm font-medium">아티스트 목록</label>
                <div className="space-y-2 mt-1">
                  {artistList.map((a) => (
                    <div key={a.id} className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">{a.artist_name}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                { label: '휴대전화', value: myMobile, setter: setMyMobile },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-sm font-medium">{label}</label>
                  <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium">아티스트 목록</label>
                <div className="space-y-2 mt-1">
                  {artistList.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">{a.artist_name}</span>
                      <button onClick={async () => {
                        await fetch(`/api/artists?id=${a.id}`, { method: 'DELETE' })
                        const res = await fetch(`/api/artists?client_id=${userInfo.client_id}`)
                        setArtistList(await res.json())
                      }} className="text-xs text-red-400">삭제</button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="아티스트명 입력" />
                    <button onClick={async () => {
                      if (!newArtistName) return
                      await fetch('/api/artists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: userInfo.client_id, artist_name: newArtistName }) })
                      setNewArtistName('')
                      const res = await fetch(`/api/artists?client_id=${userInfo.client_id}`)
                      setArtistList(await res.json())
                    }} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                  </div>
                </div>
              </div>
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
          <p className="text-xs text-center text-gray-300 mb-2">
            {typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() 
              ? `앱 버전 ${appVersion}` 
              : '웹 버전'}
          </p>
          {typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() && appVersion < minVersion && (
            <button onClick={async () => {
              const { Capacitor } = await import('@capacitor/core')
              const storeUrl = Capacitor.getPlatform() === 'ios'
                ? 'https://apps.apple.com/kr/app/id6787446365'
                : 'https://play.google.com/store/apps/details?id=com.dbmusic.viral'
              try {
                const { Browser } = await import('@capacitor/browser')
                await Browser.open({ url: storeUrl })
              } catch {
                window.open(storeUrl, '_blank')
              }
            }} className="w-full text-xs bg-blue-600 text-white rounded-lg py-2 mb-3 flex items-center justify-center gap-1"><RefreshCw size={12} /> 업데이트 하기</button>
          )}
          <hr className="my-3 border-gray-100" />
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
                  showToast('계정이 삭제됐습니다.')
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
        { icon: <LayoutGrid size={20} />, label: '프로젝트', href: '/client' },
        { icon: <BarChart2 size={20} />, label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
        { icon: <FileText size={20} />, label: '신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
        { icon: <User size={20} />, label: '마이페이지', href: '/client-mypage', active: true },
      ]} />
      <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
    </div>
    </>
  )
}