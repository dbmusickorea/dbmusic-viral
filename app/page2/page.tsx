'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page2() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [projectCode, setProjectCode] = useState('')
  const [requirements, setRequirements] = useState('')
  const [influencerName, setInfluencerName] = useState('')
  const [snsAccount, setSnsAccount] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [showExchange, setShowExchange] = useState(false)
  const [residentNumber, setResidentNumber] = useState('')
  const [address, setAddress] = useState('')
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [showMyInfo, setShowMyInfo] = useState(false)
  const [myName, setMyName] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myBankName, setMyBankName] = useState('')
  const [myAccountHolder, setMyAccountHolder] = useState('')
  const [myAccountNumber, setMyAccountNumber] = useState('')
  const [myInstagram, setMyInstagram] = useState('')
  const [myYoutube, setMyYoutube] = useState('')
  const [myTiktok, setMyTiktok] = useState('')
  const [myFacebook, setMyFacebook] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [balance, setBalance] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) {
      router.push('/')
      return
    }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    fetchBalance(parsed.id)
  }, [])

  const fetchBalance = async (id: number) => {
    const { data } = await supabase
      .from('participants')
      .select('balance')
      .eq('id', id)
      .maybeSingle()
    setBalance(data?.balance ?? 0)
  }

  const getRequirements = async (code: string) => {
    const { data } = await supabase
      .from('projects')
      .select('requirements')
      .ilike('project_code', code)
      .maybeSingle()
    setRequirements(data?.requirements ?? '')
  }

  const handleSubmit = async () => {
    if (!projectCode || !postUrl) {
      alert('프로젝트 코드와 미션 링크를 입력해주세요.')
      return
    }
    const { error } = await supabase.from('posts').insert({
      project_code: projectCode.toUpperCase(),
      influencer_name: influencerName,
      post_url: postUrl,
      platform,
      member_id: userInfo?.id
    })
    if (error) { alert('미션 제출 실패!'); return }
    alert('미션 제출 완료!')
    setProjectCode('')
    setInfluencerName('')
    setSnsAccount('')
    setPostUrl('')
    setPlatform('instagram')
    setRequirements('')
  }

  const handleExchange = async () => {
    if (!exchangeAmount) { alert('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    const taxRate = 0.033
    const taxAmount = Math.floor(amount * taxRate)
    const netAmount = amount - taxAmount

    const { error } = await supabase.from('settlements').insert({
      member_id: userInfo?.id,
      amount,
      tax_amount: taxAmount,
      net_amount: netAmount,
      resident_number: residentNumber,
      address,
      status: 'PENDING'
    })
    if (error) { alert('환전 신청 실패!'); return }
    alert('환전 신청 완료!')
    setShowExchange(false)
    setResidentNumber('')
    setAddress('')
    setExchangeAmount('')
  }

  const loadMyInfo = () => {
    setMyName(userInfo?.name ?? '')
    setMyMobile(userInfo?.mobile ?? '')
    setMyBankName(userInfo?.bank_name ?? '')
    setMyAccountHolder(userInfo?.account_holder ?? '')
    setMyAccountNumber(userInfo?.account_number ?? '')
    setMyInstagram(userInfo?.instagram_id ?? '')
    setMyYoutube(userInfo?.youtube_id ?? '')
    setMyTiktok(userInfo?.tiktok_id ?? '')
    setMyFacebook(userInfo?.facebook_id ?? '')
    setShowMyInfo(true)
  }

  const handleUpdateMyInfo = async () => {
    const { error } = await supabase.from('participants').update({
      name: myName,
      mobile: myMobile,
      bank_name: myBankName,
      account_holder: myAccountHolder,
      account_number: myAccountNumber,
      instagram_id: myInstagram,
      youtube_id: myYoutube,
      tiktok_id: myTiktok,
      facebook_id: myFacebook,
      password: myPassword || userInfo?.password
    }).eq('id', userInfo?.id)
    if (error) { alert('수정 실패!'); return }
    alert('정보 수정 완료!')
    setShowMyInfo(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">🎵 DBMUSIC 체험단</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 border rounded px-3 py-1">로그아웃</button>
        </div>

        {/* 적립금 + 버튼들 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <p className="text-sm text-gray-500">나의 적립금</p>
          <p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()}원</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowExchange(!showExchange)} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium">환전 신청</button>
            <button onClick={loadMyInfo} className="flex-1 bg-gray-500 text-white rounded-lg py-2 text-sm font-medium">내 정보 보기</button>
          </div>
        </div>

        {/* 환전 신청 폼 */}
        {showExchange && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">💰 환전 신청</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">주민번호</label>
                <input value={residentNumber} onChange={(e) => setResidentNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="주민번호 입력" />
              </div>
              <div>
                <label className="text-sm font-medium">주소</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="주소 입력" />
              </div>
              <div>
                <label className="text-sm font-medium">신청 금액</label>
                <input type="number" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="금액 입력" />
              </div>
              {exchangeAmount && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p>원천징수 (3.3%): {Math.floor(Number(exchangeAmount) * 0.033).toLocaleString()}원</p>
                  <p className="font-medium">실수령액: {(Number(exchangeAmount) - Math.floor(Number(exchangeAmount) * 0.033)).toLocaleString()}원</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleExchange} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">환전 신청하기</button>
                <button onClick={() => setShowExchange(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 내 정보 수정 폼 */}
        {showMyInfo && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-3">👤 회원정보 수정</h2>
            <div className="space-y-3">
              {[
                { label: '이름', value: myName, setter: setMyName },
                { label: '휴대전화', value: myMobile, setter: setMyMobile },
                { label: '은행명', value: myBankName, setter: setMyBankName },
                { label: '예금주', value: myAccountHolder, setter: setMyAccountHolder },
                { label: '계좌번호', value: myAccountNumber, setter: setMyAccountNumber },
                { label: '인스타그램 ID', value: myInstagram, setter: setMyInstagram },
                { label: '유튜브 ID', value: myYoutube, setter: setMyYoutube },
                { label: '틱톡 ID', value: myTiktok, setter: setMyTiktok },
                { label: '페이스북 ID', value: myFacebook, setter: setMyFacebook },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-sm font-medium">{label}</label>
                  <input value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium">새 비밀번호</label>
                <input type="password" value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="변경할 경우만 입력" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleUpdateMyInfo} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정하기</button>
                <button onClick={() => setShowMyInfo(false)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 미션 제출 폼 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">📸 미션 제출</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">의뢰인 식별 코드</label>
              <input value={projectCode} onChange={(e) => { setProjectCode(e.target.value); if (e.target.value) getRequirements(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: A_1" />
            </div>
            {requirements && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">📋 의뢰인 요청사항</p>
                <p className="text-sm text-blue-700 mt-1">{requirements}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">참여자 이름</label>
              <input value={influencerName} onChange={(e) => setInfluencerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="이름 입력" />
            </div>
            <div>
              <label className="text-sm font-medium">플랫폼 선택</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="instagram">인스타그램</option>
                <option value="youtube">유튜브</option>
                <option value="tiktok">틱톡</option>
                <option value="facebook">페이스북</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">본인 SNS 계정</label>
              <input value={snsAccount} onChange={(e) => setSnsAccount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="SNS 아이디" />
            </div>
            <div>
              <label className="text-sm font-medium">미션 완료 링크 (URL)</label>
              <input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="게시글 주소" />
            </div>
            <button onClick={handleSubmit} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">미션 제출하기</button>
          </div>
        </div>
      </div>
    </div>
  )
}