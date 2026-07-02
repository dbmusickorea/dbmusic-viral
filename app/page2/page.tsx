'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page2() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [requirements, setRequirements] = useState('')
  const [projectStatus, setProjectStatus] = useState('')
  const [projectInfo, setProjectInfo] = useState<any>(null)
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [showPosts, setShowPosts] = useState(false)
  const [rewardPerPost, setRewardPerPost] = useState(0)
  const [postFilter, setPostFilter] = useState<'current' | 'all'>('current')
  const router = useRouter()

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    setUserRole(role ?? '')
    fetchBalance(parsed.id)
    fetchMyPosts(parsed.id)
  }, [])

  const fetchBalance = async (id: number) => {
    const { data } = await supabase.from('participants').select('balance').eq('id', id).maybeSingle()
    setBalance(data?.balance ?? 0)
  }

  const fetchMyPosts = async (id: number) => {
    const { data } = await supabase.from('posts').select('*').eq('member_id', id).order('created_at', { ascending: false })
    setMyPosts(data ?? [])
  }

  const getRequirements = async (code: string) => {
    const { data } = await supabase
      .from('projects')
      .select('requirements, status, start_date, end_date, reward_per_post')
      .ilike('project_code', code)
      .maybeSingle()
    setRequirements(data?.requirements ?? '')
    setProjectStatus(data?.status ?? '')
    setProjectInfo(data)
    setRewardPerPost(data?.reward_per_post ?? 0)
  }

  const getInstagramStats = async (url: string) => {
    try {
      const shortcode = url.split('/p/')[1]?.split('/')[0]
      if (!shortcode) return { likes: 0, comments: 0 }
      const response = await fetch(`/api/instagram?shortcode=${shortcode}`)
      const data = await response.json()
      return { likes: data.like_count ?? 0, comments: data.comment_count ?? 0 }
    } catch {
      return { likes: 0, comments: 0 }
    }
  }

  const handleSubmit = async () => {
    if (!projectCode || !postUrl) { alert('프로젝트 코드와 미션 링크를 입력해주세요.'); return }
    setIsSubmitting(true)
    let likesCount = 0
    let commentsCount = 0
    if (platform === 'instagram') {
      const stats = await getInstagramStats(postUrl)
      likesCount = stats.likes
      commentsCount = stats.comments
    }
    const { error } = await supabase.from('posts').insert({
      project_code: projectCode.toUpperCase(),
      influencer_name: influencerName,
      post_url: postUrl,
      platform,
      member_id: userInfo?.id,
      likes_count: likesCount,
      comments_count: commentsCount
    })
    setIsSubmitting(false)
    if (error) { alert('미션 제출 실패!'); return }
    alert('미션 제출 완료!')
    fetchMyPosts(userInfo?.id)
    setProjectCode(''); setInfluencerName(''); setSnsAccount(''); setPostUrl('')
    setPlatform('instagram'); setRequirements(''); setProjectStatus(''); setProjectInfo(null)
  }

  const handleExchange = async () => {
    if (!exchangeAmount) { alert('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    if (amount < 10000) { alert('최소 10,000원 이상부터 환전 신청 가능합니다.'); return }
    if (amount > balance) { alert('신청 금액이 잔액을 초과합니다.'); return }
    if (projectCode && projectStatus !== 'COMPLETED') { alert('프로젝트가 종료된 후에만 환전 신청이 가능합니다.'); return }
    const taxAmount = Math.floor(amount * 0.033)
    const netAmount = amount - taxAmount
    const { error } = await supabase.from('settlements').insert({
      member_id: userInfo?.id, amount, tax_amount: taxAmount, net_amount: netAmount,
      resident_number: residentNumber, address, status: 'PENDING'
    })
    if (error) { alert('환전 신청 실패!'); return }
    alert('환전 신청 완료!')
    setShowExchange(false); setResidentNumber(''); setAddress(''); setExchangeAmount('')
  }

  const loadMyInfo = () => {
    setMyName(userInfo?.name ?? ''); setMyMobile(userInfo?.mobile ?? '')
    setMyBankName(userInfo?.bank_name ?? ''); setMyAccountHolder(userInfo?.account_holder ?? '')
    setMyAccountNumber(userInfo?.account_number ?? ''); setMyInstagram(userInfo?.instagram_id ?? '')
    setMyYoutube(userInfo?.youtube_id ?? ''); setMyTiktok(userInfo?.tiktok_id ?? '')
    setMyFacebook(userInfo?.facebook_id ?? ''); setShowMyInfo(true)
  }

  const handleUpdateMyInfo = async () => {
    const { error } = await supabase.from('participants').update({
      name: myName, mobile: myMobile, bank_name: myBankName,
      account_holder: myAccountHolder, account_number: myAccountNumber,
      instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok,
      facebook_id: myFacebook, password: myPassword || userInfo?.password
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

  // 현재 프로젝트 게시물 vs 전체 게시물
  const currentProjectPosts = projectCode
    ? myPosts.filter(p => p.project_code === projectCode.toUpperCase())
    : []
  const displayPosts = postFilter === 'current' ? currentProjectPosts : myPosts

  const instagramPosts = displayPosts.filter(p => p.platform === 'instagram')
  const youtubePosts = displayPosts.filter(p => p.platform === 'youtube')
  const tiktokPosts = displayPosts.filter(p => p.platform === 'tiktok')
  const facebookPosts = displayPosts.filter(p => p.platform === 'facebook')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">🎵 DBMUSIC 체험단</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          {userRole === 'admin' && (
            <div className="flex gap-1">
              <button onClick={() => router.push('/page1')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
              <button onClick={() => router.push('/page3')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
              <button onClick={() => router.push('/page4')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
              <button onClick={() => router.push('/page5')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
            </div>
          )}
        </div>

        {/* 적립금 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <p className="text-sm text-gray-500">나의 적립금</p>
          <p className="text-2xl font-bold text-blue-600">{balance.toLocaleString()}원</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowExchange(!showExchange)} className="flex-1 bg-green-500 text-white rounded-lg py-2 text-sm font-medium">환전 신청</button>
            <button onClick={loadMyInfo} className="flex-1 bg-gray-500 text-white rounded-lg py-2 text-sm font-medium">내 정보 보기</button>
          </div>
        </div>

        {/* 게시물 현황 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📊 나의 게시물 현황</h2>
            <button onClick={() => setShowPosts(!showPosts)} className="text-xs border rounded px-2 py-1">
              {showPosts ? '숨기기' : '금액 내역 보기'}
            </button>
          </div>

          {/* 진행 프로젝트 / 전체 내역 탭 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPostFilter('current')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'current' ? 'bg-blue-600 text-white' : 'border'}`}
            >
              진행 프로젝트
            </button>
            <button
              onClick={() => setPostFilter('all')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${postFilter === 'all' ? 'bg-blue-600 text-white' : 'border'}`}
            >
              전체 내역
            </button>
          </div>

          {postFilter === 'current' && !projectCode && (
            <p className="text-xs text-gray-400 text-center mb-3">아래 미션 제출 폼에서 프로젝트 코드를 입력하면 해당 프로젝트 게시물이 표시돼요</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <p className="text-xs text-gray-500">총 게시물</p>
              <p className="text-xl font-bold text-blue-600">{displayPosts.length}개</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">인스타그램</p>
              <p className="text-lg font-bold">{instagramPosts.length}개</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">유튜브</p>
              <p className="text-lg font-bold">{youtubePosts.length}개</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">틱톡</p>
              <p className="text-lg font-bold">{tiktokPosts.length}개</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">페이스북</p>
              <p className="text-lg font-bold">{facebookPosts.length}개</p>
            </div>
          </div>

          {/* 금액 내역 */}
          {showPosts && (
            <div className="space-y-2">
              {displayPosts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">게시물이 없습니다.</p>
              ) : (
                displayPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        <p className="text-xs text-gray-400">{post.project_code}</p>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500">링크 보기 →</a>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-medium text-blue-600">{rewardPerPost.toLocaleString()}원</p>
                        <p className="text-xs text-gray-500">❤️ {post.likes_count?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {displayPosts.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">총 예상 금액: {(displayPosts.length * rewardPerPost).toLocaleString()}원</p>
                  <p className="text-xs text-gray-500">※ 실제 정산 금액과 다를 수 있어요</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 프로젝트 기간 */}
        {projectInfo && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-2">📅 프로젝트 기간</h2>
            <p className="text-sm">시작일: {projectInfo.start_date ? new Date(projectInfo.start_date).toLocaleDateString('ko-KR') : '미정'}</p>
            <p className="text-sm">종료예정일: {projectInfo.end_date ? new Date(projectInfo.end_date).toLocaleDateString('ko-KR') : '미정'}</p>
            {projectInfo.start_date && (
              <p className="text-sm">진행일수: {Math.floor((new Date().getTime() - new Date(projectInfo.start_date).getTime()) / (1000 * 60 * 60 * 24))}일째</p>
            )}
            <p className={`text-xs mt-1 font-medium ${projectInfo.status === 'COMPLETED' ? 'text-gray-500' : projectInfo.status === 'ONGOING' ? 'text-green-600' : 'text-yellow-600'}`}>
              {projectInfo.status === 'COMPLETED' ? '✅ 종료된 프로젝트' : projectInfo.status === 'ONGOING' ? '🟢 진행중' : '⏸ 대기중'}
            </p>
          </div>
        )}

        {/* 환전 신청 폼 */}
        {showExchange && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-1">💰 환전 신청</h2>
            <p className="text-xs text-gray-500 mb-3">※ 최소 10,000원 이상, 프로젝트 종료 후 신청 가능</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">프로젝트 코드 확인</label>
                <input value={projectCode} onChange={(e) => { setProjectCode(e.target.value); if (e.target.value) getRequirements(e.target.value) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="프로젝트 코드 입력" />
                {projectCode && (
                  <p className={`text-xs mt-1 ${projectStatus === 'COMPLETED' ? 'text-green-600' : 'text-red-500'}`}>
                    {projectStatus === 'COMPLETED' ? '✅ 환전 신청 가능 (프로젝트 종료)' : '❌ 프로젝트 진행 중 - 환전 불가'}
                  </p>
                )}
              </div>
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
                <input type="number" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="금액 입력 (최소 10,000원)" />
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
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:bg-gray-400"
            >
              {isSubmitting ? '제출 중... (Instagram 데이터 수집 중)' : '미션 제출하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}