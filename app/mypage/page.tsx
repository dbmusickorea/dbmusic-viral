'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function MyPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [myName, setMyName] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myBankName, setMyBankName] = useState('')
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

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    loadMyInfo(parsed.id)
  }, [])

  const loadMyInfo = async (id: number) => {
    const res = await fetch(`/api/participants?id=${id}`)
    const data = await res.json()
    const p = data?.[0]
    if (p) {
      setMyName(p.name ?? '')
      setMyMobile(p.mobile ?? '')
      setMyBankName(p.bank_name ?? '')
      setMyAccountHolder(p.account_holder ?? '')
      setMyAccountNumber(p.account_number ?? '')
      setMyInstagram(p.instagram_id ?? '')
      setMyYoutube(p.youtube_id ?? '')
      setMyTiktok(p.tiktok_id ?? '')
      setBalance(p.balance ?? 0)
      setReferralCode(p.referral_code ?? '')
    }
  }

  const handleUpdateMyInfo = async () => {
    if (myCurrentPassword && myPassword) {
      const checkRes = await fetch(`/api/participants?id=${userInfo?.id}`)
      const checkData = await checkRes.json()
      if (checkData?.[0]?.password !== myCurrentPassword) {
        alert('기존 비밀번호가 올바르지 않아요.')
        return
      }
    }
    await fetch(`/api/participants?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: myName,
        mobile: myMobile,
        bank_name: myBankName,
        account_holder: myAccountHolder,
        account_number: myAccountNumber,
        instagram_id: myInstagram,
        youtube_id: myYoutube,
        tiktok_id: myTiktok,
        ...(myPassword ? { password: myPassword } : {})
      })
    })
    alert('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-xl">←</button>
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-4">👤 내 정보</h2>
          {referralCode && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500">나의 추천인 코드</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-lg font-bold text-blue-600">{referralCode}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(referralCode); alert('추천인 코드가 복사됐어요!') }} className="text-xs border rounded px-2 py-1 text-gray-600">복사</button>
                      {/* 공유 버튼 - 구글플레이 심사 통과 후 활성화
                      <button onClick={async () => {
                        const shareUrl = `https://app.doubleb.kr?ref=${referralCode}`
                        try {
                          const { Share } = await import('@capacitor/share')
                          await Share.share({
                            title: '더블비뮤직 체험단 가입',
                            text: `더블비뮤직 체험단에 가입하고 함께 활동해요! 추천인 코드: ${referralCode}`,
                            url: shareUrl
                          })
                        } catch (e) {}
                      }} className="text-xs bg-blue-600 text-white border rounded px-2 py-1">공유</button>
                      */}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">친구에게 이 코드를 알려주세요!</p>
                </div>
              )}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500">로그인 아이디 (이메일)</p>
              <p className="text-sm font-medium">{userInfo?.email ?? '-'}</p>
            </div>
            {[
              { label: '이름', value: myName, setter: setMyName },
              { label: '휴대전화', value: myMobile, setter: setMyMobile },
              { label: '은행명', value: myBankName, setter: setMyBankName },
              { label: '예금주', value: myAccountHolder, setter: setMyAccountHolder },
              { label: '계좌번호', value: myAccountNumber, setter: setMyAccountNumber },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-sm font-medium">{label}</label>
                <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
            ))}
            <p className="text-xs text-orange-500">⚠️ 본인 명의 계좌만 등록 가능합니다. 예금주명은 가입자 이름과 동일해야 해요.</p>
            {[
              { label: '인스타그램 ID', value: myInstagram, setter: setMyInstagram },
              { label: '유튜브 ID', value: myYoutube, setter: setMyYoutube },
              { label: '틱톡 ID', value: myTiktok, setter: setMyTiktok },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-sm font-medium">{label}</label>
                <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium">기존 비밀번호</label>
              <div className="relative mt-1">
                <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="기존 비밀번호 (변경시만)" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">새 비밀번호</label>
              <div className="relative mt-1">
                <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="새 비밀번호 (변경시만)" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button onClick={handleUpdateMyInfo} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정하기</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2 mb-3">로그아웃</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full bg-red-500 text-white rounded-lg py-2 text-sm font-medium">계정 삭제</button>
          {showDeleteConfirm && (
            <div className="mt-3 border border-red-300 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ 계정 삭제 확인</p>
              <p className="text-xs text-gray-600 mb-1">• 현재 잔여 적립금: <span className="font-bold text-red-600">{balance.toLocaleString()}P (삭제 시 소멸)</span></p>
              <p className="text-xs text-gray-600 mb-1">• 진행중 프로젝트가 있는 경우 미션 수익을 받을 수 없어요.</p>
              <p className="text-xs text-gray-600 mb-3">• 삭제 후 복구가 불가능합니다.</p>
              <p className="text-xs font-medium mb-1">아래에 <span className="text-red-600 font-bold">"탈퇴합니다"</span> 를 입력해주세요:</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3" placeholder="탈퇴합니다" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                <button disabled={deleteConfirmText !== '탈퇴합니다'} onClick={async () => {
                  await fetch(`/api/posts?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetch(`/api/comment_missions?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetch(`/api/participants?id=${userInfo?.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '탈퇴회원', mobile: '', email: '', account_number: '', account_holder: '', bank_name: '', instagram_id: '', youtube_id: '', tiktok_id: '', is_deleted: true }) })
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
      </div>
    </div>
  )
}