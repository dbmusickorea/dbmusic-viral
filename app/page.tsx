'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { initPushNotifications } from './lib/push'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // 저장된 아이디 불러오기
    const savedEmail = localStorage.getItem('savedEmail')
    const savedAutoLogin = localStorage.getItem('autoLogin')
    if (savedEmail) { setEmail(savedEmail); setSaveId(true) }
    if (savedAutoLogin === 'true') setAutoLogin(true)

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
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null)
  const [pendingRole, setPendingRole] = useState('')

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
    if (!forgotEmail) { alert('이메일을 입력해주세요.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) { alert('이메일 발송 실패! 이메일 주소를 확인해주세요.'); return }
    setForgotSent(true)
  }

  const handleSendVerifyCode = async () => {
    if (!p_mobile) { alert('휴대전화 번호를 입력해주세요.'); return }
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
      alert('인증번호가 발송됐어요!')
    } else {
      alert('발송 실패! 번호를 확인해주세요.')
    }
    setPSending(false)
  }

  const handleSendVerifyCodeClient = async () => {
    if (!c_mobile) { alert('휴대전화 번호를 입력해주세요.'); return }
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
      alert('인증번호가 발송됐어요!')
    } else {
      alert('발송 실패! 번호를 확인해주세요.')
    }
    setCSending(false)
  }

  const handleVerifyCodeClient = () => {
    if (c_codeExpiry && Date.now() > c_codeExpiry) {
      alert('인증번호가 만료됐어요. 다시 발송해주세요.')
      return
    }
    if (c_verifyCode === c_sentCode) {
      setCVerified(true)
      alert('✅ 인증 완료!')
    } else {
      alert('❌ 인증번호가 틀렸어요.')
    }
  }

  const handleVerifyCode = () => {
    if (p_codeExpiry && Date.now() > p_codeExpiry) {
      alert('인증번호가 만료됐어요. 다시 발송해주세요.')
      return
    }
    if (p_verifyCode === p_sentCode) {
      setPVerified(true)
      alert('✅ 인증 완료!')
    } else {
      alert('❌ 인증번호가 틀렸어요.')
    }
  }
  const handleSignupParticipant = async () => {
    if (!p_name || !p_email || !p_password) { alert('이름, 이메일, 비밀번호는 필수입니다.'); return }
    if (p_password !== p_passwordConfirm) { alert('비밀번호가 일치하지 않아요.'); return }

    // 이메일/전화번호 중복 체크
    const emailRes = await fetch(`/api/participants?email=${encodeURIComponent(p_email)}`)
    const emailData = await emailRes.json()
    if (emailData && emailData.length > 0) { alert('이미 사용중인 이메일입니다.'); return }
    
    const mobileRes = await fetch(`/api/participants?mobile=${p_mobile}`)
    const mobileData = await mobileRes.json()
    if (mobileData && mobileData.length > 0) { alert('이미 사용중인 전화번호입니다.'); return }
    
    const mobileURes = await fetch(`/api/users?mobile=${p_mobile}`)
    const mobileUData = await mobileURes.json()
    if (mobileUData && mobileUData.length > 0) { alert('이미 사용중인 전화번호입니다.'); return }

    if (!p_verified) { alert('휴대전화 인증을 완료해주세요.'); return }

    if (p_referral) {
      const referrerRes = await fetch(`/api/participants?referral_code=${p_referral}`)
      const referrerData = await referrerRes.json()
      const referrer = referrerData?.[0]
      if (!referrer) { alert('유효하지 않은 추천인 코드입니다.'); return }
      
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
    if (authError) { alert('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: p_name, mobile: p_mobile, email: p_email, password: '',
        bank_name: p_bank, account_holder: p_holder, account_number: p_account,
        instagram_id: p_instagram, youtube_id: p_youtube, tiktok_id: p_tiktok,
        referral_code: referralCode, level: 1
      })
    })
    if (!res.ok) { alert('회원가입 실패!'); return }
    alert(`회원가입 완료! 로그인해주세요.\n나의 추천인 코드: ${referralCode}`)
    setShowSignup(false)
    setSignupType('')
  }

  const handleSignupClient = async () => {
    if (!c_verified) { alert('휴대전화 인증을 완료해주세요.'); return }
    if (!c_name || !c_email || !c_password) { alert('대표자명, 이메일, 비밀번호는 필수입니다.'); return }
    if (c_password !== c_passwordConfirm) { alert('비밀번호가 일치하지 않아요.'); return }
    // 이메일/전화번호 중복 체크
    const emailRes = await fetch(`/api/users?email=${encodeURIComponent(c_email)}`)
    const emailData = await emailRes.json()
    if (emailData && emailData.length > 0) { alert('이미 사용중인 이메일입니다.'); return }
    
    const mobileRes = await fetch(`/api/users?mobile=${c_mobile}`)
    const mobileData = await mobileRes.json()
    if (mobileData && mobileData.length > 0) { alert('이미 사용중인 전화번호입니다.'); return }
    
    const mobilePRes = await fetch(`/api/participants?mobile=${c_mobile}`)
    const mobilePData = await mobilePRes.json()
    if (mobilePData && mobilePData.length > 0) { alert('이미 사용중인 전화번호입니다.'); return }

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
    if (authError) { alert('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: c_name, company: c_company, artist: c_artist,
        phone: c_phone, mobile: c_mobile, email: c_email,
        password: '', role: 'client', client_id: clientId
      })
    })
    if (!res.ok) { alert('회원가입 실패!'); return }
    alert(`회원가입 완료! 로그인해주세요.\n의뢰인 코드: ${clientId}`)
    setShowSignup(false)
    setSignupType('')
  }

  return (
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
          <h1 className="text-xl font-bold text-center">더블비뮤직</h1>
        </div>
      )}
      <div className="w-full max-w-sm">
        {!showSignup && !showForgotPassword ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <h1 className="text-2xl font-bold text-center mb-6">더블비뮤직 로그인</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="이메일 입력" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="비밀번호 입력" />
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
            <h1 className="text-xl font-bold text-center mb-4">회원가입</h1>

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
                  { label: '인스타그램 ID', value: p_instagram, setter: setPInstagram, placeholder: '@아이디' },
                  { label: '유튜브 ID', value: p_youtube, setter: setPYoutube, placeholder: '@아이디' },
                  { label: '틱톡 ID', value: p_tiktok, setter: setPTiktok, placeholder: '@아이디' },
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium">휴대전화 *</label>
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
                <button onClick={handleSignupParticipant} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">회원가입</button>
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
                  { label: '전화번호', value: c_phone, setter: setCPhone },
                  { label: '이메일 *', value: c_email, setter: setCEmail, type: 'email' },
                  { label: '비밀번호 *', value: c_password, setter: setCPassword, type: 'password', placeholder: '6자 이상 입력해주세요' },
                  { label: '비밀번호 확인 *', value: c_passwordConfirm, setter: setCPasswordConfirm, type: 'password', placeholder: '비밀번호를 다시 입력해주세요' },
                ].map(({ label, value, setter, type, placeholder }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder ?? ''} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
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
  )
}