'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { encryptText } from '../lib/crypto'
import BottomNav from '../../components/BottomNav'
import { RefreshCw, ArrowDown } from 'lucide-react'

const getLevelAmount = (base: number, level: number) => {
  if (level === 50) return 10000
  return base + (level - 1) * 150
}

const settlementStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">검토중</span>
    case 'APPROVED': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">승인완료</span>
    case 'REJECTED': return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">반려</span>
    default: return null
  }
}

export default function WalletPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [coverReward, setCoverReward] = useState(0)
  const [level, setLevel] = useState(1)
  const [isLocked, setIsLocked] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [settlements, setSettlements] = useState<any[]>([])
  const [projectsMap, setProjectsMap] = useState<any>({})
  const [filter, setFilter] = useState<'all' | 'earn' | 'exchange'>('all')
  const [showHistory, setShowHistory] = useState(false)
  const [showExchange, setShowExchange] = useState(false)
  const [agreedTax, setAgreedTax] = useState(false)
  const [residentNumber, setResidentNumber] = useState('')
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLevelGuide, setShowLevelGuide] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    if (!info) { router.push('/'); return }
    const parsed = JSON.parse(info)
    setUserInfo(parsed)
    loadData(parsed.id)
  }, [])

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await loadData(userInfo?.id)
    setIsRefreshing(false)
    setIsPulling(false)
  }

  const loadData = async (id: number) => {
    setLoading(true)
    const res = await fetch(`/api/participant-data?id=${id}`)
    const data = await res.json()
    const participant = data.participant

    setBalance(participant?.balance ?? 0)
    setLevel(participant?.level ?? 1)
    setIsLocked(participant?.is_locked ?? false)
    setCoverReward(participant?.cover_reward ?? 0)
    setPosts(data.posts ?? [])
    setSettlements(data.settlements ?? [])

    const settledAmount = data.settlements
      ?.filter((s: any) => ['PENDING', 'APPROVED'].includes(s.status))
      .reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0) ?? 0
    setAvailableBalance(Math.max(0, (participant?.balance ?? 0) - settledAmount))

    if (data.posts && data.posts.length > 0) {
      const codes = [...new Set(data.posts.map((p: any) => p.project_code))]
      const projectsRes = await fetch(`/api/projects?codes=${codes.join(',')}`)
      const projects = await projectsRes.json()
      const map: any = {}
      projects?.forEach((p: any) => { map[p.project_code.toUpperCase()] = p })
      setProjectsMap(map)
    }
    setLoading(false)
  }

  const handleExchange = async () => {
    if (!agreedTax) { alert('개인정보 수집 및 원천징수에 동의해주세요.'); return }
    if (isLocked) { alert('계정이 잠금 상태예요. 유튜브 댓글 10회 작성으로 잠금을 해제 후 환전 신청이 가능해요!'); return }
    if (!exchangeAmount) { alert('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    if (amount < 10000) { alert('최소 10,000P 이상부터 환전 신청 가능합니다.'); return }
    if (amount > availableBalance) { alert('환전 가능 금액을 초과합니다.'); return }

    const participantRes = await fetch(`/api/participants?ids=${userInfo?.id}`)
    const participants = await participantRes.json()
    const participantData = participants?.[0]

    if (!participantData?.account_number || !participantData?.bank_name || !participantData?.account_holder) {
      alert('계좌번호가 등록되지 않았어요. 마이페이지에서 계좌를 먼저 등록해주세요!')
      router.push('/mypage')
      return
    }

    if (participantData?.account_holder && participantData?.name) {
      if (participantData.account_holder !== participantData.name) {
        alert('예금주와 가입자 이름이 일치하지 않아요. 본인 명의 계좌만 환전 신청 가능합니다.')
        return
      }
    }

    const taxAmount = Math.floor(amount * 0.033)
    const netAmount = amount - taxAmount
    const encryptedResident = residentNumber ? await encryptText(residentNumber) : ''

    const settlementRes = await fetch('/api/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: userInfo?.id, amount, tax_amount: taxAmount, net_amount: netAmount,
        resident_number: encryptedResident, status: 'PENDING',
        is_privacy_agreed: true,
        agreed_at: new Date().toISOString(),
        user_ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'unknown')
      })
    })
    if (!settlementRes.ok) { alert('환전 신청 실패!'); return }

    const adminTokensRes = await fetch('/api/push_tokens?user_role=admin')
    const adminTokens = await adminTokensRes.json()
    if (adminTokens && adminTokens.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '💰 환전 신청이 들어왔어요!',
          body: `${userInfo?.name}님이 ${amount.toLocaleString()}P 환전을 신청했어요.`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }

    alert(`환전 신청 완료! ${netAmount.toLocaleString()}P (세후)가 신청됐어요.`)
    setExchangeAmount('')
    setAgreedTax(false)
    setResidentNumber('')
    setShowExchange(false)
    loadData(userInfo?.id)
  }

  const earnHistory = posts.map(post => {
    const project = projectsMap[post.project_code?.toUpperCase()]
    const baseAmount = project?.reward_per_post ?? 0
    const earnAmount = getLevelAmount(baseAmount, level)
    return {
      type: 'earn',
      date: post.created_at,
      label: project?.artist_name || project?.client_name || post.project_code,
      sub: post.project_code,
      amount: earnAmount,
    }
  })

  const exchangeHistory = settlements.map(s => ({
    type: 'exchange',
    date: s.requested_at,
    label: '환전 신청',
    sub: `실수령 ${s.net_amount?.toLocaleString()}P`,
    amount: s.amount,
    status: s.status,
    memo: s.memo,
  }))

  const allHistory = [...earnHistory, ...exchangeHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filteredHistory = filter === 'earn'
    ? [...earnHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : filter === 'exchange'
    ? [...exchangeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : allHistory

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">로딩 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4"
      onTouchStart={(e) => {
        if (document.documentElement.scrollTop === 0) {
          setPullStartY(e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
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
          
          <h1 className="text-xl font-bold">적립금</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto">

        {isLocked && (
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <h2 className="font-bold mb-2 text-red-600">⚠️ 계정 잠금 상태</h2>
            <p className="text-xs text-red-500 mb-3">1개월간 미션 참여가 없어서 계정이 잠겼어요. 환전 신청이 불가합니다.</p>
            <button onClick={() => router.push('/participant')} className="w-full bg-red-500 text-white rounded-lg py-2 text-sm font-medium">잠금 해제하러 가기 →</button>
          </div>
        )}

        {/* 환전가능금액 */}
        <div className="bg-blue-600 rounded-2xl p-5 mb-4 text-white">
          <p className="text-sm text-blue-200 mb-1">환전 가능 금액</p>
          <p className="text-3xl font-bold">{availableBalance.toLocaleString()}P</p>
          <p className="text-xs text-blue-200 mt-2">종료된 프로젝트 수익 + 댓글 미션 수익</p>
          <button onClick={() => setShowExchange(!showExchange)} className="mt-3 w-full bg-white text-blue-600 rounded-xl py-2 text-sm font-medium">
            {showExchange ? '환전 신청 닫기 ▲' : '환전 신청하기 ▼'}
          </button>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">Lv.{level} ({level === 50 ? '10,000' : (2500 + (level - 1) * 150).toLocaleString()}P)</span>
            <button onClick={() => setShowLevelGuide(!showLevelGuide)} className="text-xs text-blue-200 border border-blue-400 rounded px-2 py-1">
              {showLevelGuide ? '레벨안내 ▲' : '레벨안내 ▼'}
            </button>
          </div>
          {showLevelGuide && (
            <div className="mt-3 border border-blue-400 rounded-lg overflow-hidden">
              <div className="bg-blue-500 p-3 text-xs text-blue-100 space-y-1">
                <p>🎯 추천인 1명 가입 시: <span className="font-bold">+150P + 레벨 1 상승</span></p>
                <p>💰 레벨이 높을수록 게시물당 적립금이 올라가요!</p>
                <p>⭐ 최대 적립금은 <span className="font-bold">10,000P</span>입니다.</p>
              </div>
              <table className="w-full text-xs bg-white text-gray-800">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left">레벨</th>
                    <th className="py-2 px-3 text-right">게시물당 적립금</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((lv) => (
                    <tr key={lv} className={`border-t ${level === lv ? 'bg-blue-50 font-bold' : ''}`}>
                      <td className="py-2 px-3">Lv.{lv} {level === lv ? '← 현재' : ''}</td>
                      <td className="py-2 px-3 text-right text-blue-600">
                        {lv === 50 ? '10,000P' : `${(2500 + (lv - 1) * 150).toLocaleString()}P`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 계정 잠금 상태 */}
        {isLocked && (
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <h2 className="font-bold mb-2 text-red-600">⚠️ 계정 잠금 상태</h2>
            <p className="text-xs text-red-500 mb-1">1개월간 미션 참여가 없어서 계정이 잠겼어요.</p>
            <p className="text-xs text-gray-500">유튜브 댓글 10회 작성으로 잠금을 해제 후 환전 신청이 가능해요!</p>
          </div>
        )}

        {/* 환전 신청 폼 */}
        {showExchange && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="font-bold mb-1">💰 환전 신청</h2>
            <p className="text-xs text-gray-500 mb-3">※ 최소 10,000P 이상 신청 가능</p>
            {coverReward > 0 && (
              <div className="bg-purple-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500">커버영상 수익</p>
                <p className="text-xl font-bold text-purple-600">{coverReward.toLocaleString()}P</p>
                <p className="text-xs text-gray-400 mt-1">프로젝트 종료 후 15일 이후 환전 가능</p>
              </div>
            )}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-40 overflow-y-auto">
                <p className="font-medium text-gray-800 mb-2">■ 미션 완료 포인트 환전 신청에 따른 간이 용역 계약 및 법적 고지</p>
                <p className="mb-2">본 환전 신청은 주식회사 더블비뮤직(이하 '회사')과 회원(이하 '크리에이터') 간의 프리랜서 음원 바이럴 홍보 용역 계약에 의거하여 정산금이 지급되는 절차입니다.</p>
                <p className="mb-2">대한민국 소득세법 및 국세징수법에 따라, 회사는 크리에이터가 정산 요청한 금액의 총 3.3%(사업소득세 3% + 지방소득세 0.3%)를 원천징수하여 국세청에 일괄 대리 신고 및 납부할 법적 의무가 있습니다.</p>
                <p className="font-medium text-gray-800 mb-1">[개인정보 처리에 관한 필수 동의]</p>
                <p>1. 수집 및 이용 목적: 국세청 사업소득 원천징수 영수증 발행 및 세무 신고 대행</p>
                <p>2. 수집 항목: 성명, 주민등록번호, 은행명, 계좌번호, 예금주명</p>
                <p>3. 보유 및 이용 기간: 소득세법 등 관련 법령에 따른 법정 의무 보관 기간(5년) 보존 후 즉시 파기 및 삭제</p>
                <p>4. 동의 거부 권리: 귀하는 본 동의를 거부할 권리가 있으나, 거부 시 국세청 세무 신고가 불가능하므로 포인트 환전 및 현금 지급이 원천 제한됩니다.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agreedTax} onChange={(e) => setAgreedTax(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm">개인정보 수집 및 원천징수에 동의합니다 (필수)</span>
              </label>
              <div>
                <label className="text-sm font-medium">주민번호 <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-400 mt-0.5">하이픈(-) 없이 13자리 숫자만 입력해주세요. (예: 9001011234567)</p>
                <input 
                  value={residentNumber} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13)
                    setResidentNumber(val)
                  }} 
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" 
                  placeholder="주민번호 13자리 입력" 
                  maxLength={13}
                  inputMode="numeric"
                />
                {residentNumber && residentNumber.length !== 13 && (
                  <p className="text-xs text-red-400 mt-1">주민번호 13자리를 모두 입력해주세요.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">신청 금액</label>
                <input type="number" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="금액 입력 (최소 10,000P)" />
              </div>
              {exchangeAmount && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p>원천징수 (3.3%): {Math.floor(Number(exchangeAmount) * 0.033).toLocaleString()}P</p>
                  <p className="font-medium">실수령액: {(Number(exchangeAmount) - Math.floor(Number(exchangeAmount) * 0.033)).toLocaleString()}P</p>
                </div>
              )}
              <button onClick={handleExchange} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">환전 신청하기</button>
            </div>
          </div>
        )}

        {/* 총 적립금 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">총 적립금</p>
              <p className="text-2xl font-bold text-gray-800">{balance.toLocaleString()}P</p>
            </div>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs border rounded-lg px-3 py-2 text-gray-600">
              {showHistory ? '내역 접기 ▲' : '적립금 내역 ▼'}
            </button>
          </div>

          {showHistory && (
            <div className="mt-4 border-t pt-4">
              <div className="flex gap-2 mb-3">
                {(['all', 'earn', 'exchange'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${filter === f ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>
                    {f === 'all' ? '전체' : f === 'earn' ? '적립' : '환전신청'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {filteredHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">내역이 없습니다.</p>
                ) : (
                  filteredHistory.map((item, i) => (
                    <div key={i} className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                        <p className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('ko-KR')}</p>
                        {item.type === 'exchange' && (item as any).status && (
                          <div className="mt-0.5">{settlementStatusLabel((item as any).status)}</div>
                        )}
                        {item.type === 'exchange' && (item as any).memo && (
                          <div className="mt-1 bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-800 font-medium">📝 관리자 메모</p>
                            <p className="text-xs text-blue-700 mt-0.5">{(item as any).memo}</p>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm font-bold ${item.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                        {item.type === 'earn' ? '+' : '-'}{item.amount?.toLocaleString()}P
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav tabs={[
        { icon: '📊', label: '내 현황', href: '/participant' },
        { icon: '🎯', label: '프로젝트', href: '/participant' },
        { icon: '💰', label: '적립금', href: '/wallet', active: true },
        { icon: '👤', label: '마이페이지', href: '/mypage' },
      ]} />
    </div>
  )
}
