'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '../../app/lib/fetchWithAuth'
import { encryptText } from '../../app/lib/crypto'
import { useToast } from '../../components/ToastContext'
import { Wallet } from 'lucide-react'

export default function AgencyWalletPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [agencyBalance, setAgencyBalance] = useState(0)
  const [settlements, setSettlements] = useState<any[]>([])
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [residentNumber, setResidentNumber] = useState('')
  const [agreedTax, setAgreedTax] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const info = localStorage.getItem('userInfo')
    const role = localStorage.getItem('userRole')
    if (!info || role !== 'participant') { router.push('/'); return }
    const parsed = JSON.parse(info)
    if (!parsed?.is_agency) { router.push('/participant'); return }
    setUserInfo(parsed)
    setAgencyBalance(parsed.agency_balance ?? 0)
    fetchSettlements(parsed.id)
  }, [])

  const fetchSettlements = async (memberId: number) => {
    setLoading(true)
    const res = await fetchWithAuth(`/api/settlements?member_id=${memberId}&type=agency`)
    const data = await res.json()
    setSettlements(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const handleExchange = async () => {
    if (!agreedTax) { showToast('개인정보 수집 및 원천징수에 동의해주세요.'); return }
    if (!exchangeAmount) { showToast('신청 금액을 입력해주세요.'); return }
    const amount = Number(exchangeAmount)
    if (amount < 10000) { showToast('최소 10,000P 이상부터 환전 신청 가능합니다.'); return }
    if (amount > agencyBalance) { showToast('환전 가능 금액을 초과합니다.'); return }

    const participantRes = await fetchWithAuth(`/api/participants?ids=${userInfo?.id}`)
    const participants = await participantRes.json()
    const participantData = participants?.[0]

    if (!participantData?.account_number || !participantData?.bank_name || !participantData?.account_holder) {
      showToast('계좌번호가 등록되지 않았어요. 마이페이지에서 계좌를 먼저 등록해주세요!')
      router.push('/mypage')
      return
    }

    const taxAmount = Math.floor(amount * 0.033)
    const netAmount = amount - taxAmount
    const encryptedResident = residentNumber ? await encryptText(residentNumber) : ''

    const res = await fetchWithAuth('/api/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: userInfo?.id,
        amount,
        tax_amount: taxAmount,
        net_amount: netAmount,
        resident_number: encryptedResident,
        status: 'PENDING',
        is_privacy_agreed: true,
        agreed_at: new Date().toISOString(),
        type: 'agency'
      })
    })
    if (!res.ok) { showToast('환전 신청 실패!'); return }

    // agency_balance 차감
    await fetchWithAuth(`/api/participants?id=${userInfo?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agency_balance: agencyBalance - amount })
    })

    // 관리자 푸시
    const adminTokensRes = await fetchWithAuth('/api/push_tokens?user_role=admin')
    const adminTokens = await adminTokensRes.json()
    if (adminTokens?.length > 0) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '💰 에이전시 수수료 환전 신청',
          body: `${userInfo?.agency_name}(${userInfo?.name})님이 ${amount.toLocaleString()}P 환전을 신청했어요.`,
          tokens: adminTokens.map((t: any) => t.token),
          userIds: adminTokens.map((t: any) => t.user_id)
        })
      })
    }

    setAgencyBalance(prev => prev - amount)
    setExchangeAmount('')
    setAgreedTax(false)
    showToast(`환전 신청 완료! ${netAmount.toLocaleString()}P (세후)가 신청됐어요.`)
    fetchSettlements(userInfo?.id)
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">검토중</span>
      case 'APPROVED': return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">승인완료</span>
      case 'REJECTED': return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">반려</span>
      default: return null
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2"><Wallet size={20} /> 수수료 환전</h1>
          <button onClick={() => router.back()} className="text-sm text-gray-500">← 뒤로</button>
        </div>

        {/* 잔액 카드 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">수수료 잔액</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{agencyBalance.toLocaleString()}P</p>
          <p className="text-xs text-gray-400 mt-1">최소 10,000P 이상부터 환전 신청 가능</p>
        </div>

        {/* 환전 신청 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold dark:text-white mb-3">환전 신청</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium dark:text-white">신청 금액</label>
              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white"
                placeholder="10,000 이상 입력"
              />
              {exchangeAmount && Number(exchangeAmount) >= 10000 && (
                <p className="text-xs text-gray-500 mt-1">
                  세금(3.3%): -{Math.floor(Number(exchangeAmount) * 0.033).toLocaleString()}P
                  → 실수령: {(Number(exchangeAmount) - Math.floor(Number(exchangeAmount) * 0.033)).toLocaleString()}P
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium dark:text-white">사업자등록번호 (세금계산서 발행용)</label>
              <input
                type="text"
                value={residentNumber}
                onChange={(e) => setResidentNumber(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white"
                placeholder="000-00-00000"
                maxLength={12}
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={agreedTax} onChange={(e) => setAgreedTax(e.target.checked)} className="mt-0.5" />
              세금계산서 발행에 동의합니다. (필수)
            </label>
            <button
              onClick={handleExchange}
              disabled={!agreedTax || !exchangeAmount || Number(exchangeAmount) < 10000 || Number(exchangeAmount) > agencyBalance}
              className="w-full bg-green-600 text-white rounded-xl py-3 font-medium disabled:bg-gray-300"
            >
              환전 신청
            </button>
          </div>
        </div>

        {/* 신청 내역 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
          <h2 className="font-bold dark:text-white mb-3">신청 내역</h2>
          {settlements.length === 0 ? (
            <p className="text-xs text-gray-400">신청 내역이 없어요.</p>
          ) : (
            <div className="space-y-2">
              {settlements.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b dark:border-gray-700 pb-2">
                  <div>
                    <p className="text-sm dark:text-white">{s.amount.toLocaleString()}P 신청</p>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString('ko-KR')} · 실수령 {s.net_amount.toLocaleString()}P</p>
                  </div>
                  {statusLabel(s.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
