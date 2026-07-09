'use client'

import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { initPushNotifications } from './lib/push'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [signupType, setSignupType] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()

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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.')
      return
    }

    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (participant) {
      if (!participant.referral_code) {
        let referralCode = generateReferralCode()
        let isUnique = false
        while (!isUnique) {
          const { data } = await supabase.from('participants').select('id').eq('referral_code', referralCode).maybeSingle()
          if (!data) isUnique = true
          else referralCode = generateReferralCode()
        }
        await supabase.from('participants').update({ referral_code: referralCode }).eq('id', participant.id)
        participant.referral_code = referralCode
      }
      localStorage.setItem('userInfo', JSON.stringify(participant))
      localStorage.setItem('userRole', 'participant')
      if (Capacitor.isNativePlatform()) {
        await initPushNotifications(String(participant.id), 'participant')
      }
      router.push('/participant')
      return
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (user) {
      if (user.role === 'client' && !user.client_id) {
        let clientId = generateClientId()
        let isUnique = false
        while (!isUnique) {
          const { data } = await supabase.from('users').select('id').eq('client_id', clientId).maybeSingle()
          if (!data) isUnique = true
          else clientId = generateClientId()
        }
        await supabase.from('users').update({ client_id: clientId }).eq('id', user.id)
        user.client_id = clientId
      }
      localStorage.setItem('userInfo', JSON.stringify(user))
      localStorage.setItem('userRole', user.role)
      if (Capacitor.isNativePlatform()) {
        await initPushNotifications(String(user.id), user.role)
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

    if (!p_verified) { alert('휴대전화 인증을 완료해주세요.'); return }

    if (p_referral) {
      const { data: referrer } = await supabase.from('participants').select('id, balance, level, referred_by').eq('referral_code', p_referral).maybeSingle()
      if (!referrer) { alert('유효하지 않은 추천인 코드입니다.'); return }
      
      // 추천인에게 150원 적립 + 레벨 1 상승
      const newBalance = (referrer.balance ?? 0) + 150
      const newLevel = Math.min(50, (referrer.level ?? 1) + 1)
      await supabase.from('participants').update({ balance: newBalance, level: newLevel }).eq('id', referrer.id)

      // 추천인의 추천인(상위)에게 50원 적립 + 0.5레벨 (레벨은 정수라 2명당 1레벨)
      if (referrer.referred_by) {
        const { data: superReferrer } = await supabase.from('participants').select('id, balance, level').eq('referral_code', referrer.referred_by).maybeSingle()
        if (superReferrer) {
          await supabase.from('participants').update({ 
            balance: (superReferrer.balance ?? 0) + 50
          }).eq('id', superReferrer.id)
        }
      }
    }

    let referralCode = generateReferralCode()
    let isUnique = false
    while (!isUnique) {
      const { data } = await supabase.from('participants').select('id').eq('referral_code', referralCode).maybeSingle()
      if (!data) isUnique = true
      else referralCode = generateReferralCode()
    }

    const { error: authError } = await supabase.auth.signUp({
      email: p_email,
      password: p_password
    })
    if (authError) { alert('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const { error } = await supabase.from('participants').insert({
      name: p_name, mobile: p_mobile, email: p_email, password: '',
      bank_name: p_bank, account_holder: p_holder, account_number: p_account,
      instagram_id: p_instagram, youtube_id: p_youtube, tiktok_id: p_tiktok,
      referral_code: referralCode, referred_by: p_referral || null, level: 1
    })
    if (error) { alert('회원가입 실패!'); return }
    alert(`회원가입 완료! 로그인해주세요.\n나의 추천인 코드: ${referralCode}`)
    setShowSignup(false)
    setSignupType('')
  }

  const handleSignupClient = async () => {
    if (!c_verified) { alert('휴대전화 인증을 완료해주세요.'); return }
    if (!c_name || !c_email || !c_password) { alert('대표자명, 이메일, 비밀번호는 필수입니다.'); return }
    if (c_password !== c_passwordConfirm) { alert('비밀번호가 일치하지 않아요.'); return }

    let clientId = generateClientId()
    let isUnique = false
    while (!isUnique) {
      const { data } = await supabase.from('users').select('id').eq('client_id', clientId).maybeSingle()
      if (!data) isUnique = true
      else clientId = generateClientId()
    }

    const { error: authError } = await supabase.auth.signUp({
      email: c_email,
      password: c_password
    })
    if (authError) { alert('회원가입 실패! 이미 사용중인 이메일이거나 올바르지 않은 정보입니다.'); return }

    const { error } = await supabase.from('users').insert({
      name: c_name, company: c_company, artist: c_artist,
      phone: c_phone, mobile: c_mobile, email: c_email,
      password: '', role: 'client', client_id: clientId
    })
    if (error) { alert('회원가입 실패!'); return }
    alert(`회원가입 완료! 로그인해주세요.\n의뢰인 코드: ${clientId}`)
    setShowSignup(false)
    setSignupType('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 overflow-hidden" style={{padding: '1rem', paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="w-full max-w-sm">
        {!showSignup && !showForgotPassword ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <h1 className="text-2xl font-bold text-center mb-6">🎵 DBMUSIC 로그인</h1>
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
              <button onClick={handleLogin} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">로그인</button>
              <button onClick={() => setShowForgotPassword(true)} className="w-full text-sm text-gray-500 text-center">비밀번호를 잊으셨나요?</button>
              <button onClick={() => setShowSignup(true)} className="w-full border rounded-lg py-2 text-sm text-gray-600">회원가입</button>
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
                  { label: '비밀번호 *', value: p_password, setter: setPPassword, type: 'password' },
                  { label: '비밀번호 확인 *', value: p_passwordConfirm, setter: setPPasswordConfirm, type: 'password' },
                  { label: '은행명', value: p_bank, setter: setPBank },
                  { label: '예금주', value: p_holder, setter: setPHolder },
                  { label: '계좌번호', value: p_account, setter: setPAccount },
                  { label: '인스타그램 ID', value: p_instagram, setter: setPInstagram },
                  { label: '유튜브 ID', value: p_youtube, setter: setPYoutube },
                  { label: '틱톡 ID', value: p_tiktok, setter: setPTiktok },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
                <p className="text-xs text-gray-400">* 비밀번호는 6자 이상이어야 해요.</p>
                <div>
                  <label className="text-sm font-medium">휴대전화 *</label>
                  <div className="flex gap-2 mt-1">
                    <input value={p_mobile} onChange={(e) => setPMobile(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="010-0000-0000" disabled={p_verified} />
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
                  { label: '비밀번호 *', value: c_password, setter: setCPassword, type: 'password' },
                  { label: '비밀번호 확인 *', value: c_passwordConfirm, setter: setCPasswordConfirm, type: 'password' },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
                <p className="text-xs text-gray-400">* 비밀번호는 6자 이상이어야 해요.</p>
                <div>
                  <label className="text-sm font-medium">휴대전화 *</label>
                  <div className="flex gap-2 mt-1">
                    <input value={c_mobile} onChange={(e) => setCMobile(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="010-0000-0000" disabled={c_verified} />
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