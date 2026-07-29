'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { initPushNotifications } from './lib/push'
import { Eye, EyeOff } from 'lucide-react'
import { useToast } from '../components/ToastContext'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateStoreUrl, setUpdateStoreUrl] = useState('')

  useEffect(() => {
    // 앱 버전 체크
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      import('@capacitor/app').then(async ({ App }) => {
        try {
          const { Capacitor } = await import('@capacitor/core')
          const info = await App.getInfo()
          const platform = Capacitor.getPlatform()
          const res = await fetch(`/api/app_settings?key=min_version_${platform}`)
          const data = await res.json()
          const minVersion = data?.value ?? '1.0'
          if (info.version < minVersion) {
            const storeUrl = platform === 'ios' 
              ? 'https://apps.apple.com/kr/app/id6787446365'
              : 'https://play.google.com/store/apps/details?id=com.dbmusic.viral'
            setUpdateStoreUrl(storeUrl)
            setShowUpdateModal(true)
          }
        } catch {}
      })
    }
    // localStorage에서 추천인 코드 읽기 (다운로드 페이지에서 저장된 경우)
    const savedRef = localStorage.getItem('referralCode')
    if (savedRef) {
      setPReferral(savedRef)
      setShowSignup(true)
      localStorage.removeItem('referralCode')
    }
    // 저장된 아이디 불러오기
    const savedEmail = localStorage.getItem('savedEmail')
    const savedAutoLogin = localStorage.getItem('autoLogin')
    if (savedEmail) { setEmail(savedEmail); setSaveId(true) }
    if (savedAutoLogin === 'true') setAutoLogin(true)

    // URL 파라미터로 추천인 코드 자동 입력
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setPReferral(ref)
      setShowSignup(true)
      setSignupType('participant')
    }

    // 딥링크 처리
    if ((window as any).Capacitor) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', (event) => {
          const url = new URL(event.url)
          const ref = url.searchParams.get('ref')
          if (ref) {
            setPReferral(ref)
            setShowSignup(true)
          }
        })
      })
    }

    // 자동 로그인 체크
    const checkSession = async () => {
      if (savedAutoLogin !== 'true') return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userInfo = localStorage.getItem('userInfo')
      const userRole = localStorage.getItem('userRole')
      if (!userInfo || !userRole) return

      if (userRole === 'admin') router.push('/admin')
      else if (userRole === 'client') router.push('/client')
      else router.push('/participant')
    }
    checkSession()
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [signupType, setSignupType] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [saveId, setSaveId] = useState(false)
  const [autoLogin, setAutoLogin] = useState(false)

  const [p_name, setPName] = useState('')
  const [p_mobile, setPMobile] = useState('')
  const [p_email, setPEmail] = useState('')
  const [p_password, setPPassword] = useState('')
  const [p_bank, setPBank] = useState('')
  const [p_holder, setPHolder] = useState('')
  const [p_account, setPAccount] = useState('')
  const [p_instagram, setPInstagram] = useState('')
  const [p_youtube, setPYoutube] = useState('')
  const [p_tiktok, setPTiktok] = useState('')
  const [snsInputPlatform, setSnsInputPlatform] = useState('instagram')
  const [snsInputId, setSnsInputId] = useState('')
  const [p_referral, setPReferral] = useState('')
  const [p_verifyCode, setPVerifyCode] = useState('')
  const [p_sentCode, setPSentCode] = useState('')
  const [p_verified, setPVerified] = useState(false)
  const [p_sending, setPSending] = useState(false)

  const [c_name, setCName] = useState('')
  const [c_company, setCCompany] = useState('')
  const [c_artist, setCArtist] = useState('')
  const [c_phone, setCPhone] = useState('')
  const [c_mobile, setCMobile] = useState('')
  const [c_email, setCEmail] = useState('')
  const [c_password, setCPassword] = useState('')
  const [c_verifyCode, setCVerifyCode] = useState('')
  const [c_sentCode, setCSentCode] = useState('')
  const [c_verified, setCVerified] = useState(false)
  const [c_sending, setCSending] = useState(false)
  const [p_codeExpiry, setPCodeExpiry] = useState<number | null>(null)
  const [c_codeExpiry, setCCodeExpiry] = useState<number | null>(null)
  const [p_passwordConfirm, setPPasswordConfirm] = useState('')
  const [c_passwordConfirm, setCPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPPassword, setShowPPassword] = useState(false)
  const [showPPasswordConfirm, setShowPPasswordConfirm] = useState(false)
  const [showCPassword, setShowCPassword] = useState(false)
  const [showCPasswordConfirm, setShowCPasswordConfirm] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null)
  const [pendingRole, setPendingRole] = useState('')
  const [isCoverPossible, setIsCoverPossible] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [coverVideoUrl, setCoverVideoUrl] = useState('')
  const [agreedAge, setAgreedAge] = useState(false)

  const handleAgreeTerms = async () => {
    if (!pendingUserInfo || !pendingRole) return
    
    if (pendingRole === 'participant') {
      await fetch(`/api/participants?id=${pendingUserInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed_terms: true })
      })
      router.push('/participant')
    } else {
      await fetch(`/api/users?id=${pendingUserInfo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreed_terms: true })
      })
      if (pendingRole === 'admin') router.push('/admin')
      else if (pendingRole === 'client') router.push('/client')
    }
    setShowTermsModal(false)
  }

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'DB'
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const generateClientId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'CL'
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const handleLogin = async () => {
    setError('')
    // 아이디 저장
    if (saveId) {
      localStorage.setItem('savedEmail', email)
    } else {
      localStorage.removeItem('savedEmail')
    }
    
    // 자동 로그인 설정 저장
    if (autoLogin) {
      localStorage.setItem('autoLogin', 'true')
    } else {
      localStorage.setItem('autoLogin', 'false')
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.')
      return
    }

    const res = await fetch(`/api/participants?email=${encodeURIComponent(email)}`)
    const participants = await res.json()
    const participant = participants?.[0]

    if (participant) {
      if (!participant.referral_code) {
        let referralCode = generateReferralCode()
        let isUnique = false
        while (!isUnique) {
          const checkRes = await fetch(`/api/participants?referral_code=${referralCode}`)
          const checkData = await checkRes.json()
          if (!checkData?.[0]) isUnique = true
          else referralCode = generateReferralCode()
        }
        await fetch(`/api/participants?id=${participant.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referral_code: referralCode })
        })
        participant.referral_code = referralCode
      }
      localStorage.setItem('userInfo', JSON.stringify(participant))
      localStorage.setItem('userRole', 'participant')
      if (Capacitor.isNativePlatform()) {
        await initPushNotifications(String(participant.id), 'participant')
      }
      if (!participant.agreed_terms) {
        setPendingUserInfo(participant)
        setPendingRole('participant')
        setShowTermsModal(true)
        return
      }
      router.push('/participant')
      return
    }

    const userRes = await fetch(`/api/users?email=${encodeURIComponent(email)}`)
    const users = await userRes.json()
    const user = users?.[0]

    if (user) {
      if (user.role === 'client' && !user.client_id) {
        let clientId = generateClientId()
        let isUnique = false
        while (!isUnique) {
          const res = await fetch(`/api/users?client_id=${clientId}`)
          const data = await res.json()
          if (!data || data.length === 0) isUnique = true
          else clientId = generateClientId()
        }
        await fetch(`/api/users?id=${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId })
        })
        user.client_id = clientId
      }
      localStorage.setItem('userInfo', JSON.stringify(user))
      localStorage.setItem('userRole', user.role)
      if (Capacitor.isNativePlatform()) {
        await initPushNotifications(String(user.id), user.role)
      }
      // 개인정보 동의 체크
      if (!user.agreed_terms) {
        setPendingUserInfo(user)
        setPendingRole(user.role)
        setShowTermsModal(true)
        return
      }
      if (user.role === 'admin') router.push('/admin')
      else if (user.role === 'client') router.push('/client')
      return
    }

    setError('계정 정보를 찾을 수 없습니다.')
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) { showToast('이메일을 입력해주세요.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { showToast('이메일 발송 실패! 이메일 주소를 확인해주세요.'); return }
    setForgotSent(true)
  }

  const handleSendVerifyCode = async () => {
    if (!p_mobile) { showToast('휴대전화 번호를 입력해주세요.'); return }
    setPSending(true)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setPSentCode(code)
    setPCodeExpiry(Date.now() + 5 * 60 * 1000) // 5분 유효
    
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: p_mobile,
        name: p_name || '고객',
        code: code,
        expiry: '5분'
      })
    })
    const data = await response.json()
    if (data.success) {
      showToast('인증번호가 발송됐어요!')
    } else {
      showToast('발송 실패! 번호를 확인해주세요.')
    }
    setPSending(false)
  }

  const handleSendVerifyCodeClient = async () => {
    if (!c_mobile) { showToast('휴대전화 번호를 입력해주세요.'); return }
    setCSending(true)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setCSentCode(code)
    setCCodeExpiry(Date.now() + 5 * 60 * 1000) // 5분 유효
    
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: c_mobile,
        name: c_name || '고객',
        code: code,
        expiry: '5분'
      })
    })
    const data = await response.json()
    if (data.success) {
      showToast('인증번호가 발송됐어요!')
    } else {
      showToast('발송 실패! 번호를 확인해주세요.')
    }
    setCSending(false)
  }

  const handleVerifyCodeClient = () => {
    if (c_codeExpiry && Date.now() > c_codeExpiry) {
      showToast('인증번호가 만료됐어요. 다시 발송해주세요.')
      return
    }
    if (c_verifyCode === c_sentCode) {
      setCVerified(true)
      showToast('✅ 인증 완료!')
    } else {
      showToast('❌ 인증번호가 틀렸어요.')
    }
  }

  const handleVerifyCode = () => {
    if (p_codeExpiry && Date.now() > p_codeExpiry) {
      showToast('인증번호가 만료됐어요. 다시 발송해주세요.')
      return
    }
    if (p_verifyCode === p_sentCode) {
      setPVerified(true)
      showToast('✅ 인증 완료!')
    } else {
      showToast('❌ 인증번호가 틀렸어요.')
    }
  }
  const handleSignupParticipant = async () => {
    if (!p_name || !p_email || !p_password) { showToast('이름, 이메일, 비밀번호는 필수입니다.'); return }
    if (isCoverPossible && !coverVideoUrl) { showToast('커버영상 촬영 가능 선택 시 영상 링크를 입력해주세요.'); return }
    if (p_password !== p_passwordConfirm) { showToast('비밀번호가 일치하지 않아요.'); return }
    if (!p_instagram && !p_youtube && !p_tiktok) { showToast('SNS 계정을 1개 이상 등록해주세요.'); return }

    // 이메일/전화번호 중복 체크
    const emailRes = await fetch(`/api/participants?email=${encodeURIComponent(p_email)}`)
    const emailData = await emailRes.json()
    if (emailData && emailData.length > 0) { showToast('이미 사용중인 이메일입니다.'); return }
    
    const mobileRes = await fetch(`/api/participants?mobile=${p_mobile}`)
    const mobileData = await mobileRes.json()
    if (mobileData && mobileData.length > 0) { showToast('이미 사용중인 전화번호입니다.'); return }
    
    const mobileURes = await fetch(`/api/users?mobile=${p_mobile}`)
    const mobileUData = await mobileURes.json()
    if (mobileUData && mobileUData.length > 0) { showToast('이미 사용중인 전화번호입니다.'); return }

    if (!p_verified) { showToast('휴대전화 인증을 완료해주세요.'); return }

    // SNS 팔로워 100명 이상 확인 (셋 중 하나라도 100명 이상이면 통과)
    let hasEnoughFollowers = false
    let igFollowers = 0
    let igProfileImage = ''
    let ytSubscribers = 0
    let ytProfileImage = ''
    let ttFollowers = 0
    let ttProfileImage = ''
    
    if (p_instagram) {
      const igRes = await fetch(`/api/instagram-user?username=${p_instagram}`)
      const igData = await igRes.json()
      igFollowers = igData.followers ?? 0
      igProfileImage = igData.thumbnail ?? ''
      if (igFollowers >= 100) hasEnoughFollowers = true
    }
    if (p_youtube) {
      const ytRes = await fetch(`/api/youtube-channel?handle=${p_youtube}`)
      const ytData = await ytRes.json()
      ytSubscribers = ytData.subscriberCount ?? 0
      ytProfileImage = ytData.thumbnail ?? ''
      if (ytSubscribers >= 100) hasEnoughFollowers = true
    }
    if (p_tiktok) {
      const ttRes = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${p_tiktok.replace('@','')}`, {
        headers: {
          'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
          'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
        }
      })
      const ttData = await ttRes.json()
      ttFollowers = ttData?.data?.stats?.followerCount ?? 0
      ttProfileImage = ttData?.data?.user?.avatarLarger ?? ''
      if (ttFollowers >= 100) hasEnoughFollowers = true
    }

    if ((p_instagram || p_youtube || p_tiktok) && !hasEnoughFollowers) {
      showToast('인스타그램/유튜브/틱톡 중 하나 이상 팔로워 100명 이상인 계정이 필요해요.')
      return
    }

    if (p_referral) {
      const referrerRes = await fetch(`/api/participants?referral_code=${p_referral}`)
      const referrerData = await referrerRes.json()
      const referrer = referrerData?.[0]
      if (!referrer) { showToast('유효하지 않은 추천인 코드입니다.'); return }
      
      // 추천인에게 150원 적립 + 레벨 1 상승
      const newBalance = (referrer.balance ?? 0) + 150
      const newLevel = Math.min(50, (referrer.level ?? 1) + 1)
      await fetch(`/api/participants?id=${referrer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance, level: newLevel })
      })
      
      // 추천인에게 레벨 상승 푸시
      const referrerTokensRes = await fetch(`/api/push_tokens?user_id=${String(referrer.id)}`)
      const referrerTokens = await referrerTokensRes.json()
      if (referrerTokens && referrerTokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎉 레벨이 올랐어요!',
            body: `추천인 보상으로 Lv.${newLevel}이 됐어요! 150P도 적립됐어요.`,
            tokens: referrerTokens.map((t: any) => t.token),
            userIds: referrerTokens.map((t: any) => t.user_id)
          })
        })
      }

    }

    let referralCode = generateReferralCode()
    let isUnique = false
    while (!isUnique) {
      const res = await fetch(`/api/participants?referral_code=${referralCode}`)
      const data = await res.json()
      if (!data || data.length === 0) isUnique = true
      else referralCode = generateReferralCode()
    }

    const { error: authError } = await supabase.auth.signUp({
      email: p_email,
      password: p_password
    })
    if (authError) { showToast('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p_name, mobile: p_mobile, email: p_email,
        bank_name: p_bank, account_holder: p_holder, account_number: p_account,
        instagram_id: p_instagram, youtube_id: p_youtube, tiktok_id: p_tiktok,
        instagram_followers: igFollowers || null,
        instagram_profile_image: igProfileImage || null,
        youtube_subscribers: ytSubscribers || null,
        youtube_profile_image: ytProfileImage || null,
        tiktok_followers: ttFollowers || null,
        tiktok_profile_image: ttProfileImage || null,
        referral_code: referralCode, level: 1,
        is_cover_possible: isCoverPossible,
        cover_video_url: coverVideoUrl || null,
        genres: selectedGenres,
        referred_by: p_referral || null,
      })
    })
    if (!res.ok) { showToast('회원가입 실패!'); return }
    
    // 커버영상 신청 시 관리자에게 푸시
    if (isCoverPossible) {
      const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
      const adminTokens = await adminTokensRes.json()
      const adminUsersRes = await fetch('/api/users?role=admin')
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
          body: `${p_name}님이 커버영상 촬영 가능으로 가입했어요. 영상을 확인하고 승인해주세요.`,
          tokens: adminTokens?.map((t: any) => t.token) ?? [],
          userIds: allAdminIds
        })
      })
    }
    
    showToast(`회원가입 완료! 로그인해주세요.\n나의 추천인 코드: ${referralCode}`)
    setShowSignup(false)
    setSignupType('')
  }

  const handleSignupClient = async () => {
    if (!c_verified) { showToast('휴대전화 인증을 완료해주세요.'); return }
    if (!c_name || !c_email || !c_password) { showToast('대표자명, 이메일, 비밀번호는 필수입니다.'); return }
    if (c_password !== c_passwordConfirm) { showToast('비밀번호가 일치하지 않아요.'); return }
    // 이메일/전화번호 중복 체크
    const emailRes = await fetch(`/api/users?email=${encodeURIComponent(c_email)}`)
    const emailData = await emailRes.json()
    if (emailData && emailData.length > 0) { showToast('이미 사용중인 이메일입니다.'); return }
    
    const mobileRes = await fetch(`/api/users?mobile=${c_mobile}`)
    const mobileData = await mobileRes.json()
    if (mobileData && mobileData.length > 0) { showToast('이미 사용중인 전화번호입니다.'); return }
    
    const mobilePRes = await fetch(`/api/participants?mobile=${c_mobile}`)
    const mobilePData = await mobilePRes.json()
    if (mobilePData && mobilePData.length > 0) { showToast('이미 사용중인 전화번호입니다.'); return }

    let clientId = generateClientId()
    let isUnique = false
    while (!isUnique) {
      const res = await fetch(`/api/users?client_id=${clientId}`)
      const data = await res.json()
      if (!data || data.length === 0) isUnique = true
      else clientId = generateClientId()
    }

    const { error: authError } = await supabase.auth.signUp({
      email: c_email,
      password: c_password
    })
    if (authError) { showToast('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: c_name, company: c_company, artist: c_artist,
        phone: c_phone, mobile: c_mobile, email: c_email,
        role: 'client', client_id: clientId
      })
    })
    if (!res.ok) { showToast('회원가입 실패!'); return }
    showToast(`회원가입 완료! 로그인해주세요.\n의뢰인 코드: ${clientId}`)
    setShowSignup(false)
    setSignupType('')
  }

  return (
    <>
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl">
            <p className="text-3xl mb-3">🎵</p>
            <h2 className="text-lg font-bold mb-2">업데이트 안내</h2>
            <p className="text-sm text-gray-500 mb-6">새 버전이 출시됐어요!<br/>더 나은 기능을 위해 업데이트해 주세요.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpdateModal(false)} className="flex-1 border rounded-xl py-2.5 text-sm text-gray-500">나중에</button>
              <button onClick={async () => {
                try {
                  const { Browser } = await import('@capacitor/browser')
                  await Browser.open({ url: updateStoreUrl })
                } catch {
                  window.open(updateStoreUrl, '_blank')
                }
              }} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium">업데이트</button>
            </div>
          </div>
        </div>   
      )}
    <div className={`min-h-screen flex flex-col items-center bg-gray-50 ${(showSignup && signupType) || showForgotPassword ? '' : 'justify-center'}`} style={{padding: '1rem', paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      
      {/* 개인정보 동의 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-3">개인정보 수집 및 이용 동의</h2>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 h-48 overflow-y-auto text-xs text-gray-600">
              <p className="font-bold mb-2">수집 항목</p>
              <p>이름, 연락처, 이메일, 계좌번호, 주민번호, SNS 계정</p>
              <p className="font-bold mt-3 mb-2">수집 목적</p>
              <p>바이럴 마케팅 서비스 제공, 정산 및 세금 처리</p>
              <p className="font-bold mt-3 mb-2">보유 기간</p>
              <p>서비스 이용 종료 후 5년</p>
              <p className="font-bold mt-3 mb-2">제3자 제공</p>
              <p>정산 처리를 위한 세무 목적 외 제3자 제공 없음</p>
              <p className="font-bold mt-3 mb-2">동의 거부 권리</p>
              <p>동의를 거부할 수 있으나, 거부 시 서비스 이용이 제한됩니다.</p>
            </div>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); router.push('/privacy') }} className="block text-xs text-blue-500 text-center mb-3">개인정보처리방침 전문 보기 →</a>
            <button onClick={handleAgreeTerms} className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium mb-2">동의하고 시작하기</button>
            <button onClick={() => { setShowTermsModal(false); supabase.auth.signOut() }} className="w-full text-sm text-gray-500 text-center py-2">동의하지 않음 (로그아웃)</button>
          </div>
        </div>
      )}

      {(showSignup || showForgotPassword) && (
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 w-full" style={{paddingTop: 'env(safe-area-inset-top)'}}>
        </div>
      )}
      <div className="w-full max-w-sm">
        {!showSignup && !showForgotPassword ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-center mb-6">
              <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-8" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="이메일 입력" />
              </div>
              <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="비밀번호 입력" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex flex-row justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={saveId} onChange={(e) => setSaveId(e.target.checked)} />
                  아이디 저장
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
                  자동 로그인
                </label>
              </div>
              <button onClick={handleLogin} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">로그인</button>
              <button onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-gray-500 text-center">비밀번호를 잊으셨나요?</button>
              <button onClick={() => setShowSignup(true)} className="w-full border rounded-lg py-2 text-sm text-gray-600">회원가입</button>
              <a href="/privacy" className="block text-xs text-gray-400 text-center mt-2" onClick={(e) => { e.preventDefault(); router.push('/privacy') }}>개인정보처리방침</a>
              <a href="/terms" className="block text-xs text-gray-400 text-center mt-1" onClick={(e) => { e.preventDefault(); router.push('/terms') }}>이용약관</a>
            </div>
          </div>
        ) : showForgotPassword ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <h1 className="text-xl font-bold text-center mb-4">🔑 비밀번호 찾기</h1>
            {!forgotSent ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.</p>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일</label>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="이메일 입력" />
                </div>
                <button onClick={handleForgotPassword} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">재설정 링크 발송</button>
                <button onClick={() => setShowForgotPassword(false)} className="w-full border rounded-lg py-2 text-sm text-gray-600">로그인으로 돌아가기</button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-4xl">📧</p>
                <p className="font-medium">이메일을 확인해주세요!</p>
                <p className="text-sm text-gray-500">{forgotEmail}로 비밀번호 재설정 링크를 발송했어요.</p>
                <button onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail('') }} className="w-full border rounded-lg py-2 text-sm text-gray-600">로그인으로 돌아가기</button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-center mb-4">
              <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-8" />
            </div>

            {!signupType && (
              <div className="space-y-3">
                <p className="text-sm text-center text-gray-500">회원 유형을 선택해주세요</p>
                <button onClick={() => setSignupType('participant')} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">체험단 가입</button>
                <button onClick={() => setSignupType('client')} className="w-full bg-green-600 text-white rounded-lg py-2 font-medium">의뢰인 가입</button>
                <button onClick={() => setShowSignup(false)} className="w-full border rounded-lg py-2 text-sm text-gray-600">로그인으로 돌아가기</button>
              </div>
            )}

            {signupType === 'participant' && (
              <div className="space-y-3">
                <h2 className="font-bold">체험단 회원가입</h2>
                {[
                  { label: '이름 *', value: p_name, setter: setPName },
                  { label: '이메일 *', value: p_email, setter: setPEmail, type: 'email' },
                  { label: '비밀번호 *', value: p_password, setter: setPPassword, type: 'password', placeholder: '6자 이상 입력해주세요' },
                  { label: '비밀번호 확인 *', value: p_passwordConfirm, setter: setPPasswordConfirm, type: 'password', placeholder: '비밀번호를 다시 입력해주세요' },                  
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">
                      {label.replace(' *', '')}
                      {label.includes('*') && <span className="text-red-500"> *</span>}
                    </label>
                    {type === 'password' ? (
                      <div className="relative mt-1">
                        <input 
                          type={label.includes('확인') ? (showPPasswordConfirm ? 'text' : 'password') : (showPPassword ? 'text' : 'password')} 
                          value={value} 
                          onChange={(e) => setter(e.target.value)} 
                          placeholder={placeholder ?? ''} 
                          className="w-full border rounded-lg px-3 py-2 text-sm pr-10" 
                        />
                        <button type="button" onClick={() => label.includes('확인') ? setShowPPasswordConfirm(!showPPasswordConfirm) : setShowPPassword(!showPPassword)} className="absolute right-3 top-2.5 text-gray-400">
                          {(label.includes('확인') ? showPPasswordConfirm : showPPassword) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    ) : (
                      <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                    )}
                  </div>
                ))}

                {/* SNS 계정 입력 */}
                <div>
                  <label className="text-sm font-medium">SNS 계정 <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mt-1 mb-2">팔로워 100명 이상 계정을 등록해주세요. 3개 중 1개 이상 100명이 넘어야 합니다.</p>
                  <div className="flex gap-2 mb-2">
                    <select value={snsInputPlatform} onChange={(e) => setSnsInputPlatform(e.target.value)} className="border rounded-lg px-2 py-2 text-sm">
                      <option value="instagram">인스타그램</option>
                      <option value="youtube">유튜브</option>
                      <option value="tiktok">틱톡</option>
                    </select>
                    <input value={snsInputId} onChange={(e) => setSnsInputId(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="@아이디 입력" />
                    <button type="button" onClick={() => {
                      if (!snsInputId) return
                      if (snsInputPlatform === 'instagram') setPInstagram(snsInputId)
                      else if (snsInputPlatform === 'youtube') setPYoutube(snsInputId)
                      else if (snsInputPlatform === 'tiktok') setPTiktok(snsInputId)
                      setSnsInputId('')
                    }} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-2">추가</button>
                  </div>
                  <div className="space-y-1">
                    {p_instagram && (
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> {p_instagram}</span>
                        <button type="button" onClick={() => setPInstagram('')} className="text-xs text-red-400">삭제</button>
                      </div>
                    )}
                    {p_youtube && (
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> {p_youtube}</span>
                        <button type="button" onClick={() => setPYoutube('')} className="text-xs text-red-400">삭제</button>
                      </div>
                    )}
                    {p_tiktok && (
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> {p_tiktok}</span>
                        <button type="button" onClick={() => setPTiktok('')} className="text-xs text-red-400">삭제</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">휴대전화 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2 mt-1">
                    <input value={p_mobile} onChange={(e) => setPMobile(e.target.value.replace(/-/g, ''))} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="01012345678" disabled={p_verified} />
                    <button onClick={handleSendVerifyCode} disabled={p_sending || p_verified} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm disabled:bg-gray-400">
                      {p_verified ? '인증완료' : p_sending ? '발송중' : '인증'}
                    </button>
                  </div>
                  {p_sentCode && !p_verified && (
                    <div className="flex gap-2 mt-2">
                      <input value={p_verifyCode} onChange={(e) => setPVerifyCode(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="인증번호 6자리" />
                      <button onClick={handleVerifyCode} className="bg-green-600 text-white rounded-lg px-3 py-2 text-sm">확인</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">추천인 코드 (선택)</label>
                  <input value={p_referral} onChange={(e) => setPReferral(e.target.value.toUpperCase())} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="추천인 코드 입력 (예: DB1234)" />
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={true} disabled className="w-4 h-4" />
                    <span className="font-medium">일반 가입</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isCoverPossible} onChange={(e) => setIsCoverPossible(e.target.checked)} className="w-4 h-4" />
                    <span className="font-medium">커버영상 촬영 가능</span>
                  </label>
                  {isCoverPossible && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">본인의 실제 가창한 영상 링크를 필수로 남겨주세요.<br/>관리자 승인 후 커버영상 미션 참여 가능합니다.</p>
                      <input value={coverVideoUrl} onChange={(e) => setCoverVideoUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="영상 링크 입력" />
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">커버 가능 장르 (중복 선택 가능)</p>
                        <div className="grid grid-cols-2 gap-1">
                          {['발라드', '댄스/팝', 'R&B', '힙합', '트로트', '록/밴드', '인디', '기타'].map(genre => (
                            <label key={genre} className="flex items-center gap-1 text-sm cursor-pointer">
                              <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={(e) => {
                                if (e.target.checked) setSelectedGenres(prev => [...prev, genre])
                                else setSelectedGenres(prev => prev.filter(g => g !== genre))
                              }} className="w-4 h-4" />
                              {genre}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-700 font-medium">⚠️ SNS 계정 입력 안내</p>
                  <p className="text-xs text-orange-600 mt-1">반드시 본인 SNS 계정을 입력해주세요. 타인 계정 사용 시 미션 심사 반려 및 계정 정지될 수 있습니다.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={agreedAge} onChange={(e) => setAgreedAge(e.target.checked)} className="w-4 h-4" />
                  만 18세 이상임을 확인합니다. (필수)
                </label>
                <button onClick={handleSignupParticipant} disabled={!agreedAge} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-300">회원가입</button>
                <button onClick={() => setSignupType('')} className="w-full border rounded-lg py-2 text-sm text-gray-600">뒤로가기</button>
              </div>
            )}

            {signupType === 'client' && (
              <div className="space-y-3">
                <h2 className="font-bold">의뢰인 회원가입</h2>
                {[
                  { label: '대표자명 *', value: c_name, setter: setCName },
                  { label: '소속사명', value: c_company, setter: setCCompany },
                  { label: '아티스트명', value: c_artist, setter: setCArtist },
                  { label: '이메일 *', value: c_email, setter: setCEmail, type: 'email' },
                  { label: '비밀번호 *', value: c_password, setter: setCPassword, type: 'password', placeholder: '6자 이상 입력해주세요' },
                  { label: '비밀번호 확인 *', value: c_passwordConfirm, setter: setCPasswordConfirm, type: 'password', placeholder: '비밀번호를 다시 입력해주세요' },
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">
                      {label.replace(' *', '')}
                      {label.includes('*') && <span className="text-red-500"> *</span>}
                    </label>
                    {type === 'password' ? (
                      <div className="relative mt-1">
                        <input 
                          type={label.includes('확인') ? (showCPasswordConfirm ? 'text' : 'password') : (showCPassword ? 'text' : 'password')} 
                          value={value} 
                          onChange={(e) => setter(e.target.value)} 
                          placeholder={placeholder ?? ''} 
                          className="w-full border rounded-lg px-3 py-2 text-sm pr-10" 
                        />
                        <button type="button" onClick={() => label.includes('확인') ? setShowCPasswordConfirm(!showCPasswordConfirm) : setShowCPassword(!showCPassword)} className="absolute right-3 top-2.5 text-gray-400">
                          {(label.includes('확인') ? showCPasswordConfirm : showCPassword) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    ) : (
                      <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium">휴대전화 *</label>
                  <div className="flex gap-2 mt-1">
                    <input value={c_mobile} onChange={(e) => setCMobile(e.target.value.replace(/-/g, ''))} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="01012345678" disabled={c_verified} />
                    <button onClick={handleSendVerifyCodeClient} disabled={c_sending || c_verified} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm disabled:bg-gray-400">
                      {c_verified ? '인증완료' : c_sending ? '발송중' : '인증'}
                    </button>
                  </div>
                  {c_sentCode && !c_verified && (
                    <div className="flex gap-2 mt-2">
                      <input value={c_verifyCode} onChange={(e) => setCVerifyCode(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="인증번호 6자리" />
                      <button onClick={handleVerifyCodeClient} className="bg-green-600 text-white rounded-lg px-3 py-2 text-sm">확인</button>
                    </div>
                  )}
                </div>
                <button onClick={handleSignupClient} className="w-full bg-green-600 text-white rounded-lg py-2 font-medium">회원가입</button>
                <button onClick={() => setSignupType('')} className="w-full border rounded-lg py-2 text-sm text-gray-600">뒤로가기</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </> 
  )
}