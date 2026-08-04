'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../../components/ToastContext'
import AdminBottomNav from '../../components/AdminBottomNav'
import Sidebar from '../../components/Sidebar'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function AdminMypagePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

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
  const [myPassword, setMyPassword] = useState('')
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [foundUser, setFoundUser] = useState<any>(null)
  const [appVersion, setAppVersion] = useState('0')
  const [minVersion, setMinVersion] = useState('0')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info || role !== 'admin') { router.push('/'); return }
    setUserInfo(JSON.parse(info))
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
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleSearchUser = async () => {
    if (!searchEmail) return
    const res = await fetch(`/api/users?email=${searchEmail}`)
    const data = await res.json()
    if (data?.[0]) setFoundUser(data[0])
    else {
      const res2 = await fetch(`/api/participants?email=${searchEmail}`)
      const data2 = await res2.json()
      setFoundUser(data2?.[0] ?? null)
      if (!data2?.[0]) showToast('사용자를 찾을 수 없어요.', 'error')
    }
  }

  const handleAddAdmin = async () => {
    if (!foundUser) return
    if (!confirm(`${foundUser.name}님을 관리자로 추가하시겠어요?`)) return
    await fetch(`/api/users?id=${foundUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    })
    showToast('관리자로 추가됐어요!')
    setFoundUser(null)
    setSearchEmail('')
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    const info = localStorage.getItem('userInfo')
    if (info) setUserInfo(JSON.parse(info))
    setIsRefreshing(false)
    setIsPulling(false)
  }

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/admin') },
          { icon: '🏢', label: '의뢰인', onClick: () => router.push('/client') },
          { icon: '👤', label: '회원관리', onClick: () => router.push('/members') },
          { icon: '💰', label: '정산', onClick: () => router.push('/settlement') },
          { icon: '🎵', label: '커버', onClick: () => router.push('/cover') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/admin-mypage'), active: true },
        ]}
        onLogout={handleLogout}
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
          if (pullStartY > 0 && e.touches[0].clientY - pullStartY > 60) {
            setIsPulling(true)
          }
        }}
        onTouchEnd={() => {
          if (isPulling) handleRefresh()
          else setPullStartY(0)
        }}
      >
        {isPulling && (
          <div className="flex justify-center py-2 text-xs text-gray-400">
            <RefreshCw size={14} className="animate-spin mr-1" /> 새로고침 중...
          </div>
        )}
        <div className="max-w-lg mx-auto">
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
            <div className="flex justify-center mb-2">
              <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/admin')} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">관리자 마이페이지</h1>
            </div>
          </div>

          {/* 관리자 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3 dark:text-white">👤 내 정보</h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">이름</p>
              <p className="text-sm font-medium dark:text-white">{userInfo?.name ?? '-'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">이메일</p>
              <p className="text-sm font-medium dark:text-white">{userInfo?.email ?? '-'}</p>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3 dark:text-white">🔒 비밀번호 변경</h2>
            <div className="space-y-3">
              <div className="relative">
                <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm pr-10 dark:bg-gray-700 dark:text-white" placeholder="기존 비밀번호" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500">
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm pr-10 dark:bg-gray-700 dark:text-white" placeholder="새 비밀번호" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500">
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button onClick={async () => {
                if (!myCurrentPassword || !myPassword) { showToast('비밀번호를 입력해주세요.', 'error'); return }
                const res = await fetch(`/api/users?id=${userInfo?.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: myPassword })
                })
                if (res.ok) { showToast('비밀번호가 변경됐어요!'); setMyPassword(''); setMyCurrentPassword('') }
                else showToast('변경 실패!', 'error')
              }} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">변경하기</button>
            </div>
          </div>

          {/* 관리자 추가 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3 dark:text-white">➕ 관리자 추가</h2>
            <div className="flex gap-2 mb-3">
              <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="이메일로 검색" />
              <button onClick={handleSearchUser} className="bg-gray-600 text-white rounded-lg px-3 py-2 text-sm">검색</button>
            </div>
            {foundUser && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium dark:text-white">{foundUser.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{foundUser.email} · {foundUser.role}</p>
                </div>
                <button onClick={handleAddAdmin} className="text-xs bg-blue-600 text-white rounded px-3 py-1">관리자 추가</button>
              </div>
            )}
          </div>

          {/* 로그아웃 */}
          <p className="text-xs text-center text-gray-300 mb-3">
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
          <hr className="my-3 border-gray-100 dark:border-gray-700" />
          {/* 다크모드 */}
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
          {/* 로그아웃 */}
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg py-3 bg-white dark:bg-gray-800 mb-4">로그아웃</button>
        </div>
        <AdminBottomNav active="mypage" />
      </div>
    </>
  )
}
