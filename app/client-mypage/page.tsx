'use client'
import { initPushNotifications } from '../lib/push'
import { fetchWithAuth } from '../lib/fetchWithAuth'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LayoutGrid, BarChart2, User, FileText, Disc3 } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import ApplyModal from '../../components/ApplyModal'
import { useSearchParams } from 'next/navigation'
import { useToast } from '../../components/ToastContext'

export default function ClientMyPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [hasProjects, setHasProjects] = useState(true)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

  useEffect(() => {
    const checkParticipantAccount = async () => {
      const info = localStorage.getItem('userInfo')
      if (!info) return
      const parsed = JSON.parse(info)
      if (!parsed?.email) return
      const res = await fetchWithAuth(`/api/participants?email=${encodeURIComponent(parsed.email)}`)
      const participants = await res.json()
      if (participants?.[0]) setHasParticipantAccount(true)
    }
    checkParticipantAccount()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'system' | 'light' | 'dark' | null
    setTheme(saved ?? 'system')
  }, [])

  const applyTheme = (t: 'system' | 'light' | 'dark') => {
    setTheme(t)
    localStorage.setItem('theme', t)
    const html = document.documentElement
    if (t === 'dark') {
      html.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else if (t === 'light') {
      html.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      prefersDark ? html.classList.add('dark') : html.classList.remove('dark')
      localStorage.removeItem('darkMode')
    }
  }
  const [myName, setMyName] = useState('')
  const [myCompany, setMyCompany] = useState('')
  const [myArtist, setMyArtist] = useState('')
  const [myPhone, setMyPhone] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [mobileSentCode, setMobileSentCode] = useState('')
  const [mobileVerifyCode, setMobileVerifyCode] = useState('')
  const [mobileCodeExpiry, setMobileCodeExpiry] = useState<number | null>(null)
  const [mobileVerified, setMobileVerified] = useState(false)
  const [mobileSending, setMobileSending] = useState(false)
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
  const { showToast } = useToast()
  const [appVersion, setAppVersion] = useState('0')
  const [minVersion, setMinVersion] = useState('0')
  const [showParticipantSignup, setShowParticipantSignup] = useState(false)
  const [hasParticipantAccount, setHasParticipantAccount] = useState(false)
  const [ptInstagram, setPtInstagram] = useState('')
  const [ptYoutube, setPtYoutube] = useState('')
  const [ptTiktok, setPtTiktok] = useState('')
  const [ptSnsInput, setPtSnsInput] = useState('')
  const [ptSnsPlatform, setPtSnsPlatform] = useState('instagram')
  const [ptChecking, setPtChecking] = useState(false)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    if (parsed?.client_id) {
      fetchWithAuth(`/api/projects?client_id=${parsed.client_id}`).then(res => res.json()).then(data => {
        setHasProjects(Array.isArray(data) && data.length > 0)
      }).catch(() => {})
    }
    if (parsed?.id) {
      fetchWithAuth(`/api/users?id=${parsed.id}`).then(res => res.json()).then(data => {
        const latest = Array.isArray(data) ? data[0] : data
        const updatedUser = { ...parsed, has_distribution: !!latest?.has_distribution }
        setUserInfo(updatedUser)
        localStorage.setItem('userInfo', JSON.stringify(updatedUser))
      }).catch(() => {})
    }
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
          const res = await fetchWithAuth(`/api/app_settings?key=min_version_${platform}`)
          const data = await res.json()
          setMinVersion(data?.value ?? '0')
        })
      }).catch(() => {})
    }

    const loadData = async () => {
      if (parsed.client_id) {
        const reqRes = await fetchWithAuth(`/api/client_requests?client_id=${parsed.client_id}`)
        const reqData = await reqRes.json()
        setRequests(reqData ?? [])
        
        const artistRes = await fetchWithAuth(`/api/artists?client_id=${parsed.client_id}`)
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
      const reqRes = await fetchWithAuth(`/api/client_requests?client_id=${parsed.client_id}`)
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
      mobile: mobileVerified ? newMobile : myMobile
    }
    const res = await fetchWithAuth(`/api/users?id=${userInfo?.id}`, {
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
    const res = await fetchWithAuth('/api/client_requests', {
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
    
    // 관리자에게 푸시
    const adminTokensRes = await fetchWithAuth('/api/push_tokens?user_role=admin')
    const adminTokens = await adminTokensRes.json()
    if (adminTokens && adminTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📬 의뢰인 문의가 접수됐어요!', data: { url: '/admin' },
          body: `${userInfo?.name}: ${requestTitle}`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }
    
    showToast('✅ 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    const reqRes = await fetchWithAuth(`/api/client_requests?client_id=${userInfo?.client_id}`)
    setRequests(await reqRes.json())
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <>
    <ApplyModal show={showApplyModal} onClose={() => setShowApplyModal(false)} userInfo={userInfo} />
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/client') },
          { icon: '📊', label: '현황', onClick: () => { 
            sessionStorage.setItem('clientTab', 'stats')
            router.push('/client') 
          }},
          { icon: '📝', label: '신청', onClick: () => { setShowApplyModal(true); setShowSidebar(false) }},
          { icon: '📥', label: '보고서', onClick: () => { setShowSidebar(false); router.push('/client-report') }},
          ...(userInfo?.has_distribution ? [{ icon: '', label: '유통 서비스', onClick: () => router.push('/distribution') }] : []),
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/client-mypage'), active: true },
        ]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4"
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
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
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
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/client')} />
        </div>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          
          <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold dark:text-white">마이페이지</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-1/2 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold dark:text-white">내 정보</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5">정보 수정</button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">이메일</p>
                <p className="text-sm font-medium dark:text-white">{userInfo?.email ?? '-'}</p>
              </div>
              {[
                { label: '이름', value: myName },
                { label: '회사명', value: myCompany },
                { label: '휴대전화', value: myMobile },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-sm font-medium dark:text-white">{value || '-'}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-500 mb-1">아티스트 목록</p>
                {artistList.map((a) => (
                  <div key={a.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <p className="text-sm font-medium dark:text-white">{a.artist_name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">이메일 (변경 불가)</p>
                <p className="text-sm font-medium dark:text-white">{userInfo?.email ?? '-'}</p>
              </div>
              {[
                { label: '이름', value: myName, setter: setMyName },
                { label: '회사명', value: myCompany, setter: setMyCompany },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-sm font-medium dark:text-white">{label}</label>
                  <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium dark:text-white">휴대전화</label>
                <p className="text-sm text-gray-500 mt-1">{myMobile}</p>
                <div className="flex gap-2 mt-1">
                  <input value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="새 번호 입력" />
                  <button onClick={async () => {
                    if (!newMobile) { showToast('번호를 입력해주세요.'); return }
                    setMobileSending(true)
                    const code = Math.floor(100000 + Math.random() * 900000).toString()
                    setMobileSentCode(code)
                    setMobileCodeExpiry(Date.now() + 5 * 60 * 1000)
                    await fetchWithAuth('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: newMobile, name: myName || '고객', code, expiry: '5분' }) })
                    showToast('인증번호가 발송됐어요!')
                    setMobileSending(false)
                  }} disabled={mobileSending} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2">인증요청</button>
                </div>
                {mobileSentCode && !mobileVerified && (
                  <div className="flex gap-2 mt-2">
                    <input value={mobileVerifyCode} onChange={(e) => setMobileVerifyCode(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="인증번호 입력" />
                    <button onClick={() => {
                      if (mobileCodeExpiry && Date.now() > mobileCodeExpiry) { showToast('인증번호가 만료됐어요.'); return }
                      if (mobileVerifyCode === mobileSentCode) { setMobileVerified(true); showToast('✅ 인증 완료!') }
                      else showToast('❌ 인증번호가 틀렸어요.')
                    }} className="text-xs bg-green-600 text-white rounded-lg px-3 py-2">확인</button>
                  </div>
                )}
                {mobileVerified && <p className="text-xs text-green-600 mt-1">✅ 인증 완료 - 저장 시 번호가 변경됩니다.</p>}
              </div>
              <div>
                <label className="text-sm font-medium dark:text-white">아티스트 목록</label>
                <div className="space-y-2 mt-1">
                  {artistList.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <span className="text-sm dark:text-white">{a.artist_name}</span>
                      <button onClick={async () => {
                        await fetchWithAuth(`/api/artists?id=${a.id}`, { method: 'DELETE' })
                        const res = await fetchWithAuth(`/api/artists?client_id=${userInfo.client_id}`)
                        setArtistList(await res.json())
                      }} className="text-xs text-red-400">삭제</button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="아티스트명 입력" />
                    <button onClick={async () => {
                      if (!newArtistName) return
                      await fetchWithAuth('/api/artists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: userInfo.client_id, artist_name: newArtistName }) })
                      setNewArtistName('')
                      const res = await fetchWithAuth(`/api/artists?client_id=${userInfo.client_id}`)
                      setArtistList(await res.json())
                    }} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-white">기존 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm pr-10 dark:bg-gray-700 dark:text-white" placeholder="비밀번호 변경시만" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-white">새 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm pr-10 dark:bg-gray-700 dark:text-white" placeholder="새 비밀번호 변경시만" />
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

          </div>
          <div className="w-full md:w-1/2 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <p className="text-sm font-medium dark:text-white mb-3">화면 모드</p>
            <div className="flex gap-2">
              <button onClick={() => applyTheme('system')} className={`flex-1 py-2 text-xs rounded-lg border flex flex-col items-center gap-1 ${theme === 'system' ? 'bg-blue-600 text-white border-blue-600' : 'dark:border-gray-600 dark:text-gray-300'}`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" fill="currentColor"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16V20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="currentColor"/>
                </svg>
                시스템
              </button>
              <button onClick={() => applyTheme('light')} className={`flex-1 py-2 text-xs rounded-lg border flex flex-col items-center gap-1 ${theme === 'light' ? 'bg-blue-600 text-white border-blue-600' : 'dark:border-gray-600 dark:text-gray-300'}`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M12 4V2M12 20V22M6.41421 6.41421L5 5M17.728 17.728L19.1422 19.1422M4 12H2M20 12H22M17.7285 6.41421L19.1427 5M6.4147 17.728L5.00049 19.1422M12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                라이트
              </button>
              <button onClick={() => applyTheme('dark')} className={`flex-1 py-2 text-xs rounded-lg border flex flex-col items-center gap-1 ${theme === 'dark' ? 'bg-blue-600 text-white border-blue-600' : 'dark:border-gray-600 dark:text-gray-300'}`}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                  <path d="M3.32031 11.6835C3.32031 16.6541 7.34975 20.6835 12.3203 20.6835C16.1075 20.6835 19.3483 18.3443 20.6768 15.032C19.6402 15.4486 18.5059 15.6834 17.3203 15.6834C12.3497 15.6834 8.32031 11.654 8.32031 6.68342C8.32031 5.50338 8.55165 4.36259 8.96453 3.32996C5.65605 4.66028 3.32031 7.89912 3.32031 11.6835Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                다크
              </button>
            </div>
          </div>
          {hasParticipantAccount ? (
            <button onClick={async () => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
              const email = userInfo?.email
              if (!email) return
              const res = await fetchWithAuth(`/api/participants?email=${encodeURIComponent(email)}`)
              const participants = await res.json()
              const participant = participants?.[0]
              if (participant) {
                localStorage.setItem('userInfo', JSON.stringify(participant))
                localStorage.setItem('userRole', 'participant')
                if ((window as any).Capacitor?.isNativePlatform?.()) await initPushNotifications(String(participant.id), 'participant')
                router.push('/participant')
              }
            }} className="w-full text-sm text-blue-600 border border-blue-300 rounded-lg py-2 mb-3">체험단 페이지로 전환</button>
          ) : (
            <button onClick={() => setShowParticipantSignup(true)} className="w-full text-sm text-blue-600 border border-blue-300 rounded-lg py-2 mb-3">체험단으로도 이용하기</button>
          )}
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg py-2 mb-3">로그아웃</button>
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
                  await fetchWithAuth(`/api/users?id=${userInfo?.id}`, { method: 'DELETE' })
                  await supabase.auth.signOut()
                  localStorage.removeItem('userInfo')
                  localStorage.removeItem('userRole')
                  showToast('계정이 삭제됐습니다.')
                  router.push('/?signup=participant')
                }} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-300">삭제 확인</button>
              </div>
            </div>
          )}
        </div>
          </div>
        </div>
        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">주식회사 더블비뮤직 · 대표: 최병민 · 사업자등록번호: 659-87-03644</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">서울특별시 강남구 역삼로 228, 한성빌딩 4층 407호</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">고객센터: 070-8065-5811</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">제휴 및 광고 문의: doubleb@doubleb.kr</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">COPYRIGHT 2026. Double B Music Co.,Ltd. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
      <BottomNav tabs={[
        { icon: <LayoutGrid size={20} />, label: '프로젝트', href: '/client' },
        { icon: <BarChart2 size={20} />, label: '현황', onClick: () => { sessionStorage.setItem('clientTab', 'stats'); router.push('/client') } },
        { icon: <FileText size={20} />, label: '신청', onClick: () => { sessionStorage.setItem('clientTab', 'apply'); router.push('/client') } },
        { icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, label: '보고서', onClick: () => { router.push('/client-report') } },
        ...(userInfo?.has_distribution ? [{ icon: <Disc3 size={20} />, label: '유통', href: '/distribution' }] : []),
        { icon: <User size={20} />, label: '마이페이지', href: '/client-mypage', active: true },
      ]} />
      <div className="h-16 md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}} />
    </div>
    </>
  )
}