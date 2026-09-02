'use client'
import { initPushNotifications } from '../lib/push'
import BankSelect from '../../components/BankSelect'
import { fetchWithAuth } from '../lib/fetchWithAuth'
import ChatWindow from '../../components/ChatWindow'

import { useState, useEffect } from 'react'
import { BookOpen, MessageSquare, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, BarChart2, Target, Wallet, User, Briefcase } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'
import { useToast } from '../../components/ToastContext'

export default function MyPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

  useEffect(() => {
    // 의뢰인 계정 있는지 확인
    const checkClientAccount = async () => {
      const info = localStorage.getItem('userInfo')
      if (!info) return
      const parsed = JSON.parse(info)
      if (!parsed?.email) return
      const res = await fetchWithAuth(`/api/users?email=${encodeURIComponent(parsed.email)}`)
      const users = await res.json()
      if (users?.[0]?.role === 'client') setHasClientAccount(true)
    }
    checkClientAccount()
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
  const [myMobile, setMyMobile] = useState('')
  const [newMobile, setNewMobile] = useState('')
  const [mobileSentCode, setMobileSentCode] = useState('')
  const [mobileVerifyCode, setMobileVerifyCode] = useState('')
  const [mobileCodeExpiry, setMobileCodeExpiry] = useState<number | null>(null)
  const [mobileVerified, setMobileVerified] = useState(false)
  const [mobileSending, setMobileSending] = useState(false)
  const [myBankName, setMyBankName] = useState('')
  const [myBankCode, setMyBankCode] = useState('')
  const [myAccountHolder, setMyAccountHolder] = useState('')
  const [myAccountNumber, setMyAccountNumber] = useState('')
  const [myInstagram, setMyInstagram] = useState('')
  const [myYoutube, setMyYoutube] = useState('')
  const [myTiktok, setMyTiktok] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [balance, setBalance] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [snsChangeRequest, setSnsChangeRequest] = useState<{platform: string, newId: string} | null>(null)
  const [submittingSnsRequest, setSubmittingSnsRequest] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [requestTitle, setRequestTitle] = useState('')
  const [requestContent, setRequestContent] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [coverVideoUrl, setCoverVideoUrl] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isCoverPossible, setIsCoverPossible] = useState(false)
  const [referredUsers, setReferredUsers] = useState<any[]>([])
  const [appVersion, setAppVersion] = useState('0')
  const [minVersion, setMinVersion] = useState('0')
  const [showClientSignup, setShowClientSignup] = useState(false)
  const [clientCompany, setClientCompany] = useState('')
  const [clientArtist, setClientArtist] = useState('')
  const [hasClientAccount, setHasClientAccount] = useState(false)
  const { showToast } = useToast()
  const [cacheSizeMB, setCacheSizeMB] = useState<number | null>(null)
  const [clearingCache, setClearingCache] = useState(false)

  const calculateCacheSize = async () => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      const list = await Filesystem.readdir({ path: 'chat-cache', directory: Directory.Cache })
      let totalBytes = 0
      for (const entry of list.files) {
        try {
          const info = await Filesystem.stat({ path: `chat-cache/${entry.name}`, directory: Directory.Cache })
          totalBytes += info.size ?? 0
        } catch {}
      }
      setCacheSizeMB(totalBytes / (1024 * 1024))
    } catch {
      setCacheSizeMB(0)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('저장된 채팅 첨부파일 캐시를 모두 삭제하시겠어요? (채팅 목록에는 영향 없어요)')) return
    setClearingCache(true)
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      await Filesystem.rmdir({ path: 'chat-cache', directory: Directory.Cache, recursive: true })
    } catch {}
    await calculateCacheSize()
    setClearingCache(false)
    showToast('캐시를 정리했어요.')
  }

  useEffect(() => {
    calculateCacheSize()
  }, [])

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    // 관리자 채팅 푸시로 들어온 경우 자동으로 채팅창 열기
    if (sessionStorage.getItem('openAdminChat') === '1') {
      sessionStorage.removeItem('openAdminChat')
      setShowChat(true)
    }
    // 안읽은 채팅 메시지 개수
    fetchWithAuth(`/api/chat_messages?user_id=${parsed.id}&role=participant`)
      .then(r => r.json())
      .then(msgs => {
        if (Array.isArray(msgs)) {
          setChatUnreadCount(msgs.filter((m: any) => m.sender === 'admin' && !m.read_at).length)
        }
      })
    if ((window as any).Capacitor) {
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
    loadMyInfo(parsed.id)
  }, [])

  const loadMyInfo = async (id: number) => {
    const res = await fetchWithAuth(`/api/participants?id=${id}`)
    const data = await res.json()
    const p = data?.[0]
    if (p) {
      setMyName(p.name ?? '')
      setMyMobile(p.mobile ?? '')
      setMyBankName(p.bank_name ?? '')
      // bank_code 없으면 bank_name으로 자동 매핑
      if (p.bank_code) {
        setMyBankCode(p.bank_code)
      } else if (p.bank_name) {
        const { BANK_LIST } = await import('../../components/BankSelect')
        const found = BANK_LIST.find((b: any) => b.name === p.bank_name)
        if (found) {
          setMyBankCode(found.code)
          await fetchWithAuth(`/api/participants?id=${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bank_code: found.code })
          })
        }
      }
      setMyAccountHolder(p.account_holder ?? '')
      setMyAccountNumber(p.account_number ?? '')
      setMyInstagram(p.instagram_id ?? '')
      setMyYoutube(p.youtube_id ?? '')
      setMyTiktok(p.tiktok_id ?? '')
      setBalance(p.balance ?? 0)
      setReferralCode(p.referral_code ?? '')
      setCoverVideoUrl(p.cover_video_url ?? '')
      setIsCoverPossible(p.is_cover_possible ?? false)
      setSelectedGenres(p.genres ?? [])
    }
    // 문의 내역 불러오기
    const reqRes = await fetchWithAuth(`/api/client_requests?member_id=${id}`)
    const reqData = await reqRes.json()
    setRequests(reqData ?? [])
    // 추천한 사람 목록
    const refRes = await fetchWithAuth(`/api/participants?referral_code=${p.referral_code}`)
    const refData = await refRes.json()
    setReferredUsers(refData?.filter((u: any) => u.id !== id) ?? [])
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await loadMyInfo(userInfo?.id)
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const handleUpdateMyInfo = async () => {
    if (myCurrentPassword && myPassword) {
      const checkRes = await fetchWithAuth(`/api/participants?id=${userInfo?.id}`)
      const checkData = await checkRes.json()
      if (checkData?.[0]?.password !== myCurrentPassword) {
        showToast('기존 비밀번호가 올바르지 않아요.')
        return
      }
    }
    await fetchWithAuth(`/api/participants?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: myName, mobile: mobileVerified ? newMobile : myMobile, bank_name: myBankName, bank_code: myBankCode,
        account_holder: myAccountHolder, account_number: myAccountNumber,
        instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok,
        cover_video_url: coverVideoUrl || null,
        is_cover_possible: isCoverPossible,
        genres: selectedGenres,
        ...(myPassword ? { password: myPassword } : {})
      })
    })
    // 커버 링크 새로 입력 시 관리자 푸시
    if (coverVideoUrl && !userInfo?.cover_video_url) {
      const adminTokensRes = await fetchWithAuth('/api/push_tokens?user_role=admin')
      const adminTokens = await adminTokensRes.json()
      const adminUsersRes = await fetchWithAuth('/api/users?role=admin')
      const adminUsers = await adminUsersRes.json()
      const allAdminIds = [...new Set([
        ...(adminTokens?.map((t: any) => t.user_id) ?? []),
        ...(adminUsers?.map((u: any) => String(u.id)) ?? [])
      ])]
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🎵 커버영상 신청이 왔어요!',
          data: { url: '/members' },
          body: `${myName}님이 커버영상 링크를 등록했어요. 확인하고 승인해주세요.`,
          tokens: adminTokens?.map((t: any) => t.token) ?? [],
          userIds: allAdminIds
        })
      })
    }
    showToast('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
    setIsEditing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const handleSubmitRequest = async () => {
    if (isSubmittingRequest) return
    if (!requestTitle || !requestContent) { showToast('제목과 내용을 입력해주세요.'); return }
    setIsSubmittingRequest(true)
    const res = await fetchWithAuth('/api/client_requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: userInfo?.id,
        client_name: userInfo?.name,
        client_mobile: userInfo?.mobile,
        title: requestTitle,
        content: requestContent,
        user_type: 'participant'
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
          title: '📬 체험단 문의가 접수됐어요!', data: { url: '/admin' },
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
    const reqRes = await fetchWithAuth(`/api/client_requests?member_id=${userInfo?.id}`)
    setRequests(await reqRes.json())
    setIsSubmittingRequest(false)
  }

  return (
    <>
      {/* 의뢰인 가입 모달 */}
      {showClientSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-bold mb-1 dark:text-white">의뢰인 계정 추가</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">기존 계정 정보를 그대로 사용하며 의뢰인 기능을 추가로 이용할 수 있어요.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium dark:text-white">소속사명 (선택)</label>
                <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="소속사명 입력" />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-white">아티스트명 (선택)</label>
                <input value={clientArtist} onChange={(e) => setClientArtist(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="아티스트명 입력" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowClientSignup(false)} className="flex-1 border dark:border-gray-600 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400">취소</button>
              <button onClick={async () => {
                const info = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
                // client_id 생성
                const generateClientId = () => 'DB' + Math.random().toString(36).substr(2, 6).toUpperCase()
                let clientId = generateClientId()
                let isUnique = false
                while (!isUnique) {
                  const checkRes = await fetchWithAuth(`/api/users?client_id=${clientId}`)
                  const checkData = await checkRes.json()
                  if (!checkData || checkData.length === 0) isUnique = true
                  else clientId = generateClientId()
                }
                const res = await fetchWithAuth('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: info.name,
                    email: info.email,
                    mobile: info.mobile,
                    company: clientCompany,
                    artist: clientArtist,
                    role: 'client',
                    client_id: clientId,
                    agreed_terms: true
                  })
                })
                if (!res.ok) { alert('의뢰인 계정 생성 실패!'); return }
                // 생성된 계정 다시 조회
                const info2 = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
                const newUserRes = await fetchWithAuth(`/api/users?email=${encodeURIComponent(info2.email)}`)
                const newUsers = await newUserRes.json()
                const newUser = newUsers?.[0]
                if (!newUser) { alert('계정 조회 실패!'); return }
                setHasClientAccount(true)
                setShowClientSignup(false)
                localStorage.setItem('userInfo', JSON.stringify(newUser))
                localStorage.setItem('userRole', 'client')
                if ((window as any).Capacitor?.isNativePlatform?.()) await initPushNotifications(String(newUser.id), 'client')
                router.push('/client')
              }} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium">의뢰인 계정 생성</button>
            </div>
          </div>
        </div>
      )}
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📊', label: '내 현황', onClick: () => router.push('/participant') },
          { icon: '🎯', label: '프로젝트', onClick: () => { console.log('프로젝트 클릭'); sessionStorage.setItem('participantTab', 'project'); console.log('저장:', sessionStorage.getItem('participantTab')); router.push('/participant') } },
          { icon: '💰', label: '적립금', onClick: () => router.push('/wallet') },
          ...(userInfo?.is_agency ? [{ icon: '🏢', label: '에이전시', onClick: () => router.push('/agency-member') }] : []),
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/mypage'), active: true },
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
          <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer dark:invert" onClick={() => router.push('/participant')} />
        </div>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          
          <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600 dark:text-gray-300">
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
        {/* 추천인 코드 */}
        {referralCode && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">나의 추천인 코드</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-600">{referralCode}</p>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => { navigator.clipboard.writeText(referralCode); showToast('복사됐어요!') }} className="text-xs border rounded px-3 py-1.5 text-gray-600">복사</button>
                {(!(window as any).Capacitor?.isNativePlatform?.() || appVersion >= '1.2') && (
                  <button onClick={async () => {
                    const { Share } = await import('@capacitor/share')
                    await Share.share({
                      title: '더블비뮤직 체험단',
                      text: `더블비뮤직 체험단에 가입하고 적립금 받으세요! 추천 코드: ${referralCode}`,
                      url: `https://app.doubleb.kr/download?ref=${referralCode}`,
                    })
                  }} className="text-xs bg-blue-600 text-white rounded px-3 py-1.5">공유</button>
                )}
            </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">친구에게 이 코드를 알려주세요!</p>
            {referredUsers.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">추천한 친구 ({referredUsers.length}명)</p>
                <div className="space-y-1">
                  {referredUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center text-xs text-gray-500">
                      <span>{u.name}</span>
                      <span>{new Date(u.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 내 정보 */}
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
                { label: '휴대전화', value: myMobile },
                { label: '은행명', value: myBankName },
                { label: '예금주', value: myAccountHolder },
                { label: '계좌번호', value: myAccountNumber },
                { label: '인스타그램 ID', value: myInstagram },
                { label: '유튜브 ID', value: myYoutube },
                { label: '틱톡 ID', value: myTiktok },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-sm font-medium dark:text-white">{value || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">이메일 (변경 불가)</p>
                <p className="text-sm font-medium dark:text-white">{userInfo?.email ?? '-'}</p>
              </div>
              {[
                { label: '이름', value: myName, setter: setMyName },
              ].map(({ label, value, setter, custom, placeholder }: any) => (
                <div key={label}>
                  <label className="text-sm font-medium dark:text-white">{label}</label>
                  {custom ? custom : <input value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />}
                </div>
              ))}
              <p className="text-xs text-orange-500 flex items-center gap-0.5"><AlertTriangle size={10} /> 본인 명의 계좌만 등록 가능합니다.</p>
              {[
                { label: '예금주', value: myAccountHolder, setter: setMyAccountHolder },
                {
                  label: '은행명',
                  custom: (
                    <BankSelect value={myBankCode} onChange={(code, name) => { setMyBankCode(code); setMyBankName(name) }} />
                  )
                },
                { label: '계좌번호', value: myAccountNumber, setter: setMyAccountNumber, placeholder: '하이픈(-) 없이 숫자만 입력' },
              ].map(({ label, value, setter, custom, placeholder }: any) => (
                <div key={label}>
                  <label className="text-sm font-medium dark:text-white">{label}</label>
                  {custom ? custom : <input value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />}
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
                {mobileVerified && <p className="text-xs text-green-600 mt-1 flex items-center gap-0.5"><CheckCircle size={10} /> 인증 완료 - 저장 시 번호가 변경됩니다.</p>}
              </div>               
              <div>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={isCoverPossible} onChange={(e) => setIsCoverPossible(e.target.checked)} className="w-4 h-4" />
                  <span className="dark:text-white">커버영상 촬영 가능</span>
                </label>
              </div>
              {isCoverPossible && (
                <div>
                  <label className="text-sm font-medium dark:text-white">커버영상 링크</label>
                  {!coverVideoUrl && (
                    <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-2 mb-1 mt-1">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-0.5"><AlertTriangle size={10} /> 커버영상 링크를 등록해야 승인을 받을 수 있어요!</p>
                    </div>
                  )}
                  <input value={coverVideoUrl} onChange={(e) => setCoverVideoUrl(e.target.value)} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" placeholder="본인 가창 영상 링크 입력" />
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">커버 가능 장르 (중복 선택 가능)</p>
                    <div className="grid grid-cols-2 gap-1">
                      {['발라드', '댄스/팝', 'R&B', '힙합', '트로트', '록/밴드', '인디', '기타'].map(genre => (
                        <label key={genre} className="flex items-center gap-1 text-sm cursor-pointer dark:text-gray-300">
                          <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={(e) => {
                            if (e.target.checked) setSelectedGenres(prev => [...prev, genre])
                            else setSelectedGenres(prev => prev.filter(g => g !== genre))
                          }} className="w-4 h-4" />
                          {genre}
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">관리자 승인 후 커버영상 미션 참여 가능합니다.</p>
                </div>
              )}
              <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-2">
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium flex items-center gap-0.5"><AlertTriangle size={10} /> SNS 계정 변경 안내</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">SNS 계정 변경은 관리자 승인 후 반영됩니다. 반드시 본인 계정을 입력해주세요.</p>
              </div>
              {[
                { label: '인스타그램 ID', value: myInstagram, platform: 'instagram' },
                { label: '유튜브 ID', value: myYoutube, platform: 'youtube' },
                { label: '틱톡 ID', value: myTiktok, platform: 'tiktok' },
              ].map(({ label, value, platform }) => (
                <div key={label}>
                  <label className="text-sm font-medium dark:text-white">{label}</label>
                  <div className="flex gap-2 mt-1">
                    <input disabled value={value} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 dark:text-gray-300" />
                    <button onClick={() => setSnsChangeRequest({ platform, newId: value })} className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg px-3 py-2">변경 요청</button>
                  </div>
                </div>
              ))}
              {snsChangeRequest && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <p className="text-xs font-medium text-blue-800 mb-2">SNS 계정 변경 요청</p>
                  <input value={snsChangeRequest.newId} onChange={(e) => setSnsChangeRequest({...snsChangeRequest, newId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="새 계정 입력" />
                  <div className="flex gap-2">
                    <button disabled={submittingSnsRequest} onClick={async () => {
                      if (submittingSnsRequest) return
                      setSubmittingSnsRequest(true)
                      const oldId = snsChangeRequest.platform === 'instagram' ? myInstagram : snsChangeRequest.platform === 'youtube' ? myYoutube : myTiktok
                      const submitRes = await fetchWithAuth('/api/sns_change_requests', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          member_id: userInfo?.id,
                          platform: snsChangeRequest.platform,
                          old_id: oldId,
                          new_id: snsChangeRequest.newId,
                          status: 'PENDING'
                        })
                      })
                      if (!submitRes.ok) {
                        const errData = await submitRes.json().catch(() => ({}))
                        showToast(errData.error || '요청 접수에 실패했어요.', 'error')
                        setSubmittingSnsRequest(false)
                        return
                      }
                      // 관리자 푸시
                      const adminTokensRes = await fetchWithAuth('/api/push_tokens?user_role=admin')
                      const adminTokens = await adminTokensRes.json()
                      const adminUsersRes = await fetchWithAuth('/api/users?role=admin')
                      const adminUsers = await adminUsersRes.json()
                      const allAdminIds = [...new Set([
                        ...(adminTokens?.map((t: any) => t.user_id) ?? []),
                        ...(adminUsers?.map((u: any) => String(u.id)) ?? [])
                      ])]
                      await fetch('/api/push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: '📱 SNS 계정 변경 요청이 왔어요!',
                          data: { url: '/members' },
                          body: `${myName}님이 ${snsChangeRequest.platform} 계정 변경을 요청했어요.`,
                          tokens: adminTokens?.map((t: any) => t.token) ?? [],
                          userIds: allAdminIds
                        })
                      })
                      showToast('변경 요청이 접수됐어요. 관리자 승인 후 반영됩니다.')
                      setSubmittingSnsRequest(false)
                      setSnsChangeRequest(null)
                    }} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">{submittingSnsRequest ? '처리중...' : '요청 제출'}</button>
                    <button onClick={() => setSnsChangeRequest(null)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm">취소</button>
                  </div>
                </div>
              )}
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
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg py-2 text-sm font-medium">취소</button>
              </div>
            </div>
          )}
        </div>

          </div>
          <div className="w-full md:w-1/2 space-y-4">
        {/* 사용 가이드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <button onClick={() => router.push('/guide')} className="w-full flex justify-between items-center">
            <span className="font-medium text-sm dark:text-white flex items-center gap-1"><BookOpen size={14} /> 크리에이터 사용 가이드</span>
            <span className="text-gray-400 dark:text-gray-300">→</span>
          </button>
        </div>

        {/* 관리자와 대화 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <button onClick={() => { window.scrollTo(0, 0); setShowChat(true) }} className="w-full flex justify-between items-center">
            <h2 className="font-bold dark:text-white flex items-center gap-1">
              <MessageSquare size={16} /> 관리자와 대화하기
              {chatUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center ml-1">{chatUnreadCount}</span>
              )}
            </h2>
            <span className="text-xs text-blue-600 dark:text-blue-400">문의사항을 남겨보세요 &gt;</span>
          </button>
        </div>
        {showChat && userInfo && (
          <ChatWindow
            userId={String(userInfo.id)}
            role="participant"
            viewerType="user"
            title="관리자와의 대화"
            onBack={() => { setShowChat(false); setChatUnreadCount(0) }}
          />
        )}

        {/* 화면 모드 */}
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
        {/* 채팅 첨부파일 캐시 */}
        {typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() && (
          <div className="border dark:border-gray-600 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium dark:text-white">채팅 첨부파일 캐시</p>
                <p className="text-xs text-gray-400">{cacheSizeMB === null ? '계산 중...' : `${cacheSizeMB.toFixed(1)}MB 사용 중`}</p>
              </div>
              <button onClick={handleClearCache} disabled={clearingCache || !cacheSizeMB} className="text-xs border dark:border-gray-500 dark:text-gray-300 rounded-lg px-3 py-1.5 disabled:opacity-40">
                {clearingCache ? '정리 중...' : '캐시 비우기'}
              </button>
            </div>
          </div>
        )}

        {/* 로그아웃 / 계정삭제 */}
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
          {hasClientAccount ? (
            <button onClick={async () => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
              const email = userInfo?.email
              if (!email) return
              const res = await fetchWithAuth(`/api/users?email=${encodeURIComponent(email)}`)
              const users = await res.json()
              const user = users?.[0]
              if (user) {
                localStorage.setItem('userInfo', JSON.stringify(user))
                localStorage.setItem('userRole', user.role)
                if ((window as any).Capacitor?.isNativePlatform?.()) await initPushNotifications(String(user.id), user.role)
                router.push('/client')
              }
            }} className="w-full text-sm text-green-600 border border-green-300 rounded-lg py-2 mb-3">의뢰인 페이지로 전환</button>
          ) : (
            <button onClick={() => setShowClientSignup(true)} className="w-full text-sm text-green-600 border border-green-300 rounded-lg py-2 mb-3">의뢰인으로도 이용하기</button>
          )}
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2 mb-3">로그아웃</button>
          <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full text-xs text-red-400 text-center py-1">계정 삭제</button>
          {showDeleteConfirm && (
            <div className="mt-3 border border-red-300 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> 계정 삭제 확인</p>
              <p className="text-xs text-gray-600 mb-1">• 현재 잔여 적립금: <span className="font-bold text-red-600">{balance.toLocaleString()}P (삭제 시 소멸)</span></p>
              <p className="text-xs text-gray-600 mb-1">• 진행중 프로젝트가 있는 경우 미션 수익을 받을 수 없어요.</p>
              <p className="text-xs text-gray-600 mb-3">• 삭제 후 복구가 불가능합니다.</p>
              <p className="text-xs font-medium mb-1">아래에 <span className="text-red-600 font-bold">"탈퇴합니다"</span>를 입력해주세요:</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3" placeholder="탈퇴합니다" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="flex-1 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg py-2 text-sm font-medium">취소</button>
                <button disabled={deleteConfirmText !== '탈퇴합니다'} onClick={async () => {
                  await fetchWithAuth(`/api/posts?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetchWithAuth(`/api/comment_missions?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetchWithAuth(`/api/participants?id=${userInfo?.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '탈퇴회원', mobile: '', email: '', account_number: '', account_holder: '', bank_name: '', instagram_id: '', youtube_id: '', tiktok_id: '', is_deleted: true }) })
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
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">주식회사 더블비뮤직 · 대표: 최병민 · 사업자등록번호: 659-87-03644</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">서울특별시 강남구 역삼로 228, 한성빌딩 4층 407호</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">고객센터: 070-8065-5811</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">제휴 및 광고 문의: doubleb@doubleb.kr</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">COPYRIGHT 2026. Double B Music Co.,Ltd. ALL RIGHTS RESERVED.</p>
        </div>
          </div>
        </div>
      </div>
      <BottomNav tabs={[
        { icon: <BarChart2 size={20} />, label: '내 현황', href: '/participant' },
        { icon: <Target size={20} />, label: '프로젝트', badge: typeof window !== 'undefined' ? Number(localStorage.getItem('unjoinedCount') ?? 0) : 0, onClick: () => { sessionStorage.setItem('participantTab', 'project'); router.push('/participant') } },
        { icon: <Wallet size={20} />, label: '적립금', href: '/wallet' },
        ...(userInfo?.is_agency ? [{ icon: <Briefcase size={20} />, label: '에이전시', href: '/agency-member' }] : []),
        { icon: <User size={20} />, label: '마이페이지', href: '/mypage', active: true },
      ]} />
    </div>
    </>
  )
}