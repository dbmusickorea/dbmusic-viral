'use client'

import { useState } from 'react'
import { supabase } from './lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [signupType, setSignupType] = useState('')
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
  const [p_facebook, setPFacebook] = useState('')
  const [p_referral, setPReferral] = useState('')

  const [c_name, setCName] = useState('')
  const [c_company, setCCompany] = useState('')
  const [c_artist, setCArtist] = useState('')
  const [c_phone, setCPhone] = useState('')
  const [c_mobile, setCMobile] = useState('')
  const [c_email, setCEmail] = useState('')
  const [c_password, setCPassword] = useState('')

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'DB'
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const ensureReferralCode = async (participant: any) => {
    if (participant.referral_code) return participant
    
    let referralCode = generateReferralCode()
    let isUnique = false
    while (!isUnique) {
      const { data } = await supabase.from('participants').select('id').eq('referral_code', referralCode).maybeSingle()
      if (!data) isUnique = true
      else referralCode = generateReferralCode()
    }
    
    await supabase.from('participants').update({ referral_code: referralCode }).eq('id', participant.id)
    return { ...participant, referral_code: referralCode }
  }

  const handleLogin = async () => {
    setError('')
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle()

    if (participant) {
      const updated = await ensureReferralCode(participant)
      localStorage.setItem('userInfo', JSON.stringify(updated))
      localStorage.setItem('userRole', 'participant')
      router.push('/page2')
      return
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle()

    if (user) {
      localStorage.setItem('userInfo', JSON.stringify(user))
      localStorage.setItem('userRole', user.role)
      if (user.role === 'admin') router.push('/page1')
      else if (user.role === 'client') router.push('/page3')
      return
    }

    setError('이메일 또는 비밀번호가 일치하지 않습니다.')
  }

  const handleSignupParticipant = async () => {
    if (!p_name || !p_email || !p_password) { alert('이름, 이메일, 비밀번호는 필수입니다.'); return }

    if (p_referral) {
      const { data: referrer } = await supabase
        .from('participants')
        .select('id')
        .eq('referral_code', p_referral)
        .maybeSingle()
      if (!referrer) { alert('유효하지 않은 추천인 코드입니다.'); return }
    }

    let referralCode = generateReferralCode()
    let isUnique = false
    while (!isUnique) {
      const { data } = await supabase.from('participants').select('id').eq('referral_code', referralCode).maybeSingle()
      if (!data) isUnique = true
      else referralCode = generateReferralCode()
    }

    const { error } = await supabase.from('participants').insert({
      name: p_name, mobile: p_mobile, email: p_email, password: p_password,
      bank_name: p_bank, account_holder: p_holder, account_number: p_account,
      instagram_id: p_instagram, youtube_id: p_youtube, tiktok_id: p_tiktok,
      facebook_id: p_facebook, referral_code: referralCode,
      referred_by: p_referral || null, level: 1
    })
    if (error) { alert('회원가입 실패!'); return }
    alert(`회원가입 완료! 나의 추천인 코드: ${referralCode}`)
    setShowSignup(false)
    setSignupType('')
  }

  const handleSignupClient = async () => {
    const { error } = await supabase.from('users').insert({
      name: c_name, company: c_company, artist: c_artist,
      phone: c_phone, mobile: c_mobile, email: c_email,
      password: c_password, role: 'client'
    })
    if (error) { alert('회원가입 실패!'); return }
    alert('회원가입 완료! 로그인해주세요.')
    setShowSignup(false)
    setSignupType('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {!showSignup ? (
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
              <button onClick={() => setShowSignup(true)} className="w-full border rounded-lg py-2 text-sm text-gray-600">회원가입</button>
            </div>
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
                  { label: '휴대전화', value: p_mobile, setter: setPMobile },
                  { label: '이메일 *', value: p_email, setter: setPEmail, type: 'email' },
                  { label: '비밀번호 *', value: p_password, setter: setPPassword, type: 'password' },
                  { label: '은행명', value: p_bank, setter: setPBank },
                  { label: '예금주', value: p_holder, setter: setPHolder },
                  { label: '계좌번호', value: p_account, setter: setPAccount },
                  { label: '인스타그램 ID', value: p_instagram, setter: setPInstagram },
                  { label: '유튜브 ID', value: p_youtube, setter: setPYoutube },
                  { label: '틱톡 ID', value: p_tiktok, setter: setPTiktok },
                  { label: '페이스북 ID', value: p_facebook, setter: setPFacebook },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium">추천인 코드 (선택)</label>
                  <input
                    value={p_referral}
                    onChange={(e) => setPReferral(e.target.value.toUpperCase())}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    placeholder="추천인 코드 입력 (예: DB1234)"
                  />
                </div>
                <button onClick={handleSignupParticipant} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">회원가입</button>
                <button onClick={() => setSignupType('')} className="w-full border rounded-lg py-2 text-sm text-gray-600">뒤로가기</button>
              </div>
            )}

            {signupType === 'client' && (
              <div className="space-y-3">
                <h2 className="font-bold">의뢰인 회원가입</h2>
                {[
                  { label: '대표자명', value: c_name, setter: setCName },
                  { label: '소속사명', value: c_company, setter: setCCompany },
                  { label: '아티스트명', value: c_artist, setter: setCArtist },
                  { label: '전화번호', value: c_phone, setter: setCPhone },
                  { label: '휴대전화', value: c_mobile, setter: setCMobile },
                  { label: '이메일', value: c_email, setter: setCEmail, type: 'email' },
                  { label: '비밀번호', value: c_password, setter: setCPassword, type: 'password' },
                ].map(({ label, value, setter, type }) => (
                  <div key={label}>
                    <label className="text-sm font-medium">{label}</label>
                    <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
                ))}
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