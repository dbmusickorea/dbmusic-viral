'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'
import Sidebar from '../../components/Sidebar'

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
  const [isEditing, setIsEditing] = useState(false)
  const [snsChangeRequest, setSnsChangeRequest] = useState<{platform: string, newId: string} | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [requestTitle, setRequestTitle] = useState('')
  const [requestContent, setRequestContent] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [coverVideoUrl, setCoverVideoUrl] = useState('')
  const [isCoverPossible, setIsCoverPossible] = useState(false)
  const [referredUsers, setReferredUsers] = useState<any[]>([])

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
      setCoverVideoUrl(p.cover_video_url ?? '')
      setIsCoverPossible(p.is_cover_possible ?? false)
    }
    // 문의 내역 불러오기
    const reqRes = await fetch(`/api/client_requests?member_id=${id}`)
    const reqData = await reqRes.json()
    setRequests(reqData ?? [])
    // 추천한 사람 목록
    const refRes = await fetch(`/api/participants?referral_code=${p.referral_code}`)
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
        name: myName, mobile: myMobile, bank_name: myBankName,
        account_holder: myAccountHolder, account_number: myAccountNumber,
        instagram_id: myInstagram, youtube_id: myYoutube, tiktok_id: myTiktok,
        cover_video_url: coverVideoUrl || null,
        ...(myPassword ? { password: myPassword } : {})
      })
    })
    // 커버 링크 새로 입력 시 관리자 푸시
    if (coverVideoUrl && !userInfo?.cover_video_url) {
      const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
      const adminTokens = await adminTokensRes.json()
      if (adminTokens && adminTokens.length > 0) {
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🎵 커버영상 신청이 왔어요!',
            body: `${myName}님이 커버영상 링크를 등록했어요. 확인하고 승인해주세요.`,
            tokens: adminTokens.map((t: any) => t.token),
            userIds: adminTokens.map((t: any) => t.user_id)
          })
        })
      }
    }
    alert('정보 수정 완료!')
    setMyPassword('')
    setMyCurrentPassword('')
    setIsEditing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleSubmitRequest = async () => {
    if (!requestTitle || !requestContent) { alert('제목과 내용을 입력해주세요.'); return }
    const res = await fetch('/api/client_requests', {
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
    if (!res.ok) { alert('등록 실패!'); return }
    alert('✅ 문의가 등록됐어요!')
    setRequestTitle('')
    setRequestContent('')
    setShowRequestForm(false)
    const reqRes = await fetch(`/api/client_requests?member_id=${userInfo?.id}`)
    setRequests(await reqRes.json())
  }

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📊', label: '내 현황', onClick: () => router.push('/participant') },
          { icon: '🎯', label: '프로젝트', onClick: () => { console.log('프로젝트 클릭'); sessionStorage.setItem('participantTab', 'project'); console.log('저장:', sessionStorage.getItem('participantTab')); router.push('/participant') } },
          { icon: '💰', label: '적립금', onClick: () => router.push('/wallet') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/mypage'), active: true },
        ]}
      />
      <div className="min-h-screen bg-gray-50 p-4"
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
      <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
        {(isPulling || isRefreshing) && (
          <div className="text-center py-1 text-sm text-blue-500 flex items-center justify-center gap-1">
            {isRefreshing ? (
              <><RefreshCw size={14} className="animate-spin" /> 새로고침 중...</>
            ) : (
              <><ArrowDown size={14} /> 놓으면 새로고침</>
            )}
          </div>
        )}
        <div className="max-w-lg mx-auto flex items-center gap-3">
          
          <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto">

        {/* 추천인 코드 */}
        {referralCode && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">나의 추천인 코드</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-600">{referralCode}</p>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => { navigator.clipboard.writeText(referralCode); alert('복사됐어요!') }} className="text-xs border rounded px-3 py-1.5 text-gray-600">복사</button>
                <button onClick={async () => {
                const { Share } = await import('@capacitor/share')
                await Share.share({
                  title: '더블비뮤직 체험단',
                  text: `더블비뮤직 체험단에 가입하고 적립금 받으세요! 추천 코드: ${referralCode}`,
                  url: `https://app.doubleb.kr/download?ref=${referralCode}`,
                })
              }} className="text-xs bg-blue-600 text-white rounded px-3 py-1.5">공유</button>
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
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">👤 내 정보</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5">정보 수정</button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium">{userInfo?.email ?? '-'}</p>
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
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium">{value || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">이메일 (변경 불가)</p>
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
              <p className="text-xs text-orange-500">⚠️ 본인 명의 계좌만 등록 가능합니다.</p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-orange-700 font-medium">⚠️ SNS 계정 변경 안내</p>
                <p className="text-xs text-orange-600 mt-1">SNS 계정 변경은 관리자 승인 후 반영됩니다. 반드시 본인 계정을 입력해주세요.</p>
              </div>
              {isCoverPossible && (
                <div>
                  <label className="text-sm font-medium">커버영상 링크</label>
                  {!coverVideoUrl && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-1 mt-1">
                      <p className="text-xs text-orange-600 font-medium">⚠️ 커버영상 링크를 등록해야 승인을 받을 수 있어요!</p>
                    </div>
                  )}
                  <input value={coverVideoUrl} onChange={(e) => setCoverVideoUrl(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="본인 가창 영상 링크 입력" />
                  <p className="text-xs text-gray-400 mt-1">관리자 승인 후 커버영상 미션 참여 가능합니다.</p>
                </div>
              )}
              {[
                { label: '인스타그램 ID', value: myInstagram, platform: 'instagram' },
                { label: '유튜브 ID', value: myYoutube, platform: 'youtube' },
                { label: '틱톡 ID', value: myTiktok, platform: 'tiktok' },
              ].map(({ label, value, platform }) => (
                <div key={label}>
                  <label className="text-sm font-medium">{label}</label>
                  <div className="flex gap-2 mt-1">
                    <input disabled value={value} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-gray-50" />
                    <button onClick={() => setSnsChangeRequest({ platform, newId: value })} className="text-xs bg-gray-200 rounded-lg px-3 py-2">변경 요청</button>
                  </div>
                </div>
              ))}
              {snsChangeRequest && (
                <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                  <p className="text-xs font-medium text-blue-800 mb-2">SNS 계정 변경 요청</p>
                  <input value={snsChangeRequest.newId} onChange={(e) => setSnsChangeRequest({...snsChangeRequest, newId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" placeholder="새 계정 입력" />
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      const oldId = snsChangeRequest.platform === 'instagram' ? myInstagram : snsChangeRequest.platform === 'youtube' ? myYoutube : myTiktok
                      await fetch('/api/sns_change_requests', {
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
                      // 관리자 푸시
                      const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
                      const adminTokens = await adminTokensRes.json()
                      if (adminTokens && adminTokens.length > 0) {
                        await fetch('/api/push', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: '📱 SNS 계정 변경 요청이 왔어요!',
                            body: `${myName}님이 ${snsChangeRequest.platform} 계정 변경을 요청했어요.`,
                            tokens: adminTokens.map((t: any) => t.token),
                            userIds: adminTokens.map((t: any) => t.user_id)
                          })
                        })
                      }
                      alert('변경 요청이 접수됐어요. 관리자 승인 후 반영됩니다.')
                      setSnsChangeRequest(null)
                    }} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">요청 제출</button>
                    <button onClick={() => setSnsChangeRequest(null)} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm">취소</button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">기존 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showCurrentPassword ? 'text' : 'password'} value={myCurrentPassword} onChange={(e) => setMyCurrentPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="비밀번호 변경시만" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">새 비밀번호</label>
                <div className="relative mt-1">
                  <input type={showNewPassword ? 'text' : 'password'} value={myPassword} onChange={(e) => setMyPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm pr-10" placeholder="새 비밀번호 변경시만" />
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

        {/* 사용 가이드 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <button onClick={() => router.push('/guide')} className="w-full flex justify-between items-center">
            <span className="font-medium text-sm">📖 크리에이터 사용 가이드</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* 문의하기 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">💬 문의하기</h2>
            <button onClick={() => setShowRequestForm(!showRequestForm)} className="text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5">
              {showRequestForm ? '닫기' : '문의 등록'}
            </button>
          </div>
          {showRequestForm && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium">제목</label>
                <input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="문의 제목" />
              </div>
              <div>
                <label className="text-sm font-medium">내용</label>
                <textarea value={requestContent} onChange={(e) => setRequestContent(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 h-24" placeholder="문의 내용" />
              </div>
              <button onClick={handleSubmitRequest} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">문의 등록하기</button>
            </div>
          )}
          {requests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">문의 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p>
                  {r.reply && (
                    <div className="mt-2 bg-blue-50 rounded p-2">
                      <p className="text-xs text-blue-800 font-medium">📝 답변</p>
                      <p className="text-xs text-blue-700 mt-0.5">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 로그아웃 / 계정삭제 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2 mb-3">로그아웃</button>
          <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full text-xs text-red-400 text-center py-1">계정 삭제</button>
          {showDeleteConfirm && (
            <div className="mt-3 border border-red-300 rounded-lg p-4 bg-red-50">
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ 계정 삭제 확인</p>
              <p className="text-xs text-gray-600 mb-1">• 현재 잔여 적립금: <span className="font-bold text-red-600">{balance.toLocaleString()}P (삭제 시 소멸)</span></p>
              <p className="text-xs text-gray-600 mb-1">• 진행중 프로젝트가 있는 경우 미션 수익을 받을 수 없어요.</p>
              <p className="text-xs text-gray-600 mb-3">• 삭제 후 복구가 불가능합니다.</p>
              <p className="text-xs font-medium mb-1">아래에 <span className="text-red-600 font-bold">"탈퇴합니다"</span>를 입력해주세요:</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3" placeholder="탈퇴합니다" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }} className="flex-1 bg-gray-200 rounded-lg py-2 text-sm font-medium">취소</button>
                <button disabled={deleteConfirmText !== '탈퇴합니다'} onClick={async () => {
                  await fetch(`/api/posts?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetch(`/api/comment_missions?member_id=${userInfo?.id}`, { method: 'DELETE' })
                  await fetch(`/api/participants?id=${userInfo?.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '탈퇴회원', mobile: '', email: '', account_number: '', account_holder: '', bank_name: '', instagram_id: '', youtube_id: '', tiktok_id: '', is_deleted: true }) })
                  localStorage.removeItem('userInfo')
                  localStorage.removeItem('userRole')
                  alert('계정이 삭제됐습니다.')
                  router.push('/')
                }} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-300">삭제 확인</button>
              </div>
            </div>
          )}
        </div>
        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500 font-medium mb-2">더블비뮤직 · 대표: 최병민 · 사업자등록번호: 280-02-02331</p>
          <p className="text-xs text-gray-400 mb-1">서울특별시 송파구 백제고분로 116, 3층 611호</p>
          <p className="text-xs text-gray-400 mb-1">고객센터: 010-7593-7966</p>
          <p className="text-xs text-gray-400 mb-3">제휴 및 광고 문의: db.music.korea@gmail.com</p>
          <p className="text-xs text-gray-300">COPYRIGHT 2026. 더블비뮤직 ALL RIGHTS RESERVED.</p>
        </div>
      </div>
      <BottomNav tabs={[
        { icon: '📊', label: '내 현황', href: '/participant' },
        { icon: '🎯', label: '프로젝트', onClick: () => { sessionStorage.setItem('participantTab', 'project'); router.push('/participant') } },
        { icon: '💰', label: '적립금', href: '/wallet' },
        { icon: '👤', label: '마이페이지', href: '/mypage', active: true },
      ]} />
    </div>
    </>
  )
}