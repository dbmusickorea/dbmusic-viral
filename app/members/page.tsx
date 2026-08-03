'use client'
import PlatformIcon from '../../components/PlatformIcon'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { decryptText, encryptText } from '../lib/crypto'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { useToast } from '../../components/ToastContext'
import Sidebar from '../../components/Sidebar'
import AdminBottomNav from '../../components/AdminBottomNav'

function ActivityDetail({ memberId, onUpdate }: { memberId: number, onUpdate?: () => void }) {
  const { showToast } = useToast()
  const [activityTab, setActivityTab] = useState<'missions' | 'points' | 'penalty'>('missions')
  const [participations, setParticipations] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [settlements, setSettlements] = useState<any[]>([])
  const [participant, setParticipant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [referredUsers, setReferredUsers] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [partRes, postRes, settleRes, memberRes, phRes] = await Promise.all([
        fetch(`/api/project_participants?member_id=${memberId}`),
        fetch(`/api/posts?member_id=${memberId}`),
        fetch(`/api/settlements?member_id=${memberId}`),
        fetch(`/api/participants?id=${memberId}`),
        fetch(`/api/point_history?member_id=${memberId}`)
      ])
      const partData = await partRes.json()
      setParticipations(Array.isArray(partData) ? partData : [])
      setPosts(await postRes.json())
      setSettlements(await settleRes.json())
      const data = await memberRes.json()
      setParticipant(data?.[0])
      setPointHistory(await phRes.json())
      if (data?.[0]?.referral_code) {
        try {
          const refRes = await fetch(`/api/participants?referred_by=${data[0].referral_code}`)
          const refData = await refRes.json()
          setReferredUsers(Array.isArray(refData) ? refData : [])
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [memberId])

  if (loading) return <p className="text-sm text-gray-400 text-center py-4">로딩 중...</p>

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(['missions', 'points', 'penalty'] as const).map(t => (
          <button key={t} onClick={() => setActivityTab(t)} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${activityTab === t ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>
            {t === 'missions' ? '미션현황' : t === 'points' ? '포인트' : '페널티'}
          </button>
        ))}
      </div>

      {activityTab === 'missions' && (
        <div className="space-y-2">
          {participations.length === 0 ? <p className="text-sm text-gray-400 text-center py-2">참여 내역 없음</p> : 
          participations.map(p => {
            const projectPosts = posts.filter(post => post.project_code?.toLowerCase() === p.project_code?.toLowerCase())
            return (
              <div key={p.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {p.projects?.artist_name || p.projects?.client_name 
                        ? `${p.projects?.artist_name || p.projects?.client_name} / ${p.projects?.song_title ?? ''}` 
                        : p.project_code}
                    </p>
                    <p className="text-xs text-gray-400">{p.project_code}</p>
                    <p className="text-xs text-gray-500">참여일: {new Date(p.joined_at).toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-gray-500">게시물: {projectPosts.length}개</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : p.projects?.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                      {p.status === 'CANCELLED' ? '취소' : p.projects?.status === 'COMPLETED' ? '완료' : '진행중'}
                    </span>
                    {p.status === 'BANNED' && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">🚫 밴</span>}
                    {participant?.cover_penalty_until && new Date(participant.cover_penalty_until) > new Date() && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">⚠️ 커버페널티</span>}
                  </div>
                </div>
                {projectPosts.map(post => (
                  <div key={post.id} className="mt-2 bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                    <a href={post.post_url} target="_blank" className="text-xs text-blue-500">링크 보기 →</a>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activityTab === 'points' && (
        <div className="space-y-2">
          <div className="bg-blue-50 rounded-lg p-3 mb-2">
            <p className="text-xs text-gray-500">현재 잔액</p>
            <p className="text-lg font-bold text-blue-600">{participant?.balance?.toLocaleString()}P</p>
          </div>
          {settlements.length === 0 ? <p className="text-sm text-gray-400 text-center py-2">환전 내역 없음</p> :
          settlements.map(s => (
            <div key={s.id} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">환전 신청</p>
                <p className="text-xs text-gray-500">{new Date(s.requested_at).toLocaleDateString('ko-KR')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'APPROVED' ? 'bg-green-100 text-green-700' : s.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                  {s.status === 'APPROVED' ? '승인' : s.status === 'PENDING' ? '검토중' : '반려'}
                </span>
              </div>
              <p className="text-sm font-bold text-red-500">-{s.amount?.toLocaleString()}P</p>
            </div>
          ))}
          {referredUsers.map(u => (
            <div key={`ref-${u.id}`} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">추천인 보상 ({u.name})</p>
                <p className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
              <p className="text-sm font-bold text-blue-500">+150P</p>
            </div>
          ))}
          {pointHistory.length > 0 && pointHistory.map(ph => (
            <div key={ph.id} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{ph.memo || '관리자 지급'}</p>
                <p className="text-xs text-gray-500">{new Date(ph.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
              <p className={`text-sm font-bold ${ph.amount < 0 ? "text-red-500" : "text-blue-500"}`}>{ph.amount > 0 ? "+" : ""}{ph.amount?.toLocaleString()}P</p>
            </div>
          ))}
        </div>
      )}

      {activityTab === 'penalty' && (
        <div className="space-y-2">
          {!participations.some(p => p.status === 'BANNED' && !p.is_cover) && (
            <div className={`rounded-lg p-3 ${participant?.is_locked ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{participant?.is_locked ? '⚠️ 계정 잠금 상태' : '✅ 정상 상태'}</p>
                  {participant?.is_locked && <p className="text-xs text-gray-500 mt-1">댓글 인증 {participant?.comment_count_for_unlock ?? 0}/10</p>}
                </div>
                {participant?.is_locked && (
                  <button onClick={async () => {
                    await fetch(`/api/participants?id=${memberId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_locked: false, comment_count_for_unlock: 0 })
                    })
                    showToast('잠금 해제 완료!')
                  }} className="text-xs bg-green-600 text-white rounded px-2 py-1">잠금 해제</button>
                )}
              </div>
            </div>
          )}
          {participations.some(p => p.status === 'BANNED' && !p.is_cover) && (
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-600">🚫 활동 제한 중</p>
                  {participations.filter(p => p.status === 'BANNED' && !p.is_cover).map(pp => (
                    <p key={pp.id} className="text-xs text-gray-500 mt-1">
                      {pp.projects?.artist_name ?? pp.project_code} / {pp.projects?.song_title ?? ''} - 해제일: {pp.banned_until ? new Date(pp.banned_until).toLocaleDateString('ko-KR') : '미정'}
                    </p>
                  ))}
                  {participant?.ban_reason && <p className="text-xs text-red-500 mt-1">사유: {participant.ban_reason}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={async () => {
                    await fetch(`/api/participants?id=${memberId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ banned_until: null, ban_reason: null })
                    })
                    // project_participants ACTIVE로 변경 (재참여) - is_cover=false인 것만
                    const bannedPps = participations.filter(p => !p.is_cover && p.status === 'BANNED')
                    for (const pp of bannedPps) {
                      await supabase
                        .from('project_participants')
                        .update({ status: 'ACTIVE', ban_exempt: true })
                        .eq('id', pp.id)
                    }
                    showToast('밴 해제 완료! (프로젝트 재참여)')
                    const res = await fetch(`/api/participants?id=${memberId}`)
                    const data = await res.json()
                    setParticipant(data?.[0])
                    onUpdate?.()
                    const tokensRes = await fetch(`/api/push_tokens?user_id=${String(memberId)}`)
                    const tokens = await tokensRes.json()
                    if (tokens?.length > 0) {
                      await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '✅ 활동 제한이 해제됐어요!', data: { url: '/participant' }, body: '다시 미션에 참여할 수 있어요.', tokens: tokens.map((t: any) => t.token), userIds: [String(memberId)] }) })
                    }
                  }} className="text-xs bg-green-600 text-white rounded px-2 py-1">해제+재참여</button>
                  <button onClick={async () => {
                    await fetch(`/api/participants?id=${memberId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ banned_until: null, ban_reason: null })
                    })
                    // project_participants BANNED 유지 (재참여 없음)
                    showToast('밴 해제 완료! (프로젝트 제외)')
                    const res = await fetch(`/api/participants?id=${memberId}`)
                    const data = await res.json()
                    setParticipant(data?.[0])
                    onUpdate?.()
                    const tokensRes = await fetch(`/api/push_tokens?user_id=${String(memberId)}`)
                    const tokens = await tokensRes.json()
                    if (tokens?.length > 0) {
                      await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '✅ 활동 제한이 해제됐어요!', data: { url: '/participant' }, body: '다시 미션에 참여할 수 있어요.', tokens: tokens.map((t: any) => t.token), userIds: [String(memberId)] }) })
                    }
                  }} className="text-xs bg-red-600 text-white rounded px-2 py-1">해제+제외</button>
                </div>
              </div>
            </div>
          )}
          {participant?.cover_penalty_until && new Date(participant.cover_penalty_until) > new Date() && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    {participant?.cover_penalty_reason === 'deleted' ? '⚠️ 커버 게시물 삭제 페널티' : '⚠️ 커버 미업로드 페널티'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">해제일: {new Date(participant.cover_penalty_until).toLocaleDateString('ko-KR')}</p>
                  <p className="text-xs text-gray-500">남은 기간: {Math.ceil((new Date(participant.cover_penalty_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={async () => {
                    await fetch(`/api/participants?id=${memberId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ cover_penalty_until: null, cover_penalty_reason: null })
                    })
                    const crRes = await fetch(`/api/cover_requests?participant_id=${memberId}`)
                    const crData = await crRes.json()
                    for (const cr of crData?.filter((r: any) => r.status === 'PENALTY' || r.status === 'REJECTED') ?? []) {
                      await fetch(`/api/cover_requests?id=${cr.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'PENDING', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
                      })
                    }
                    showToast('커버 페널티 해제 완료! (재참여 가능)')
                    onUpdate?.()
                  }} className="text-xs bg-orange-600 text-white rounded px-2 py-1">해제+재참여</button>
                  <button onClick={async () => {
                    await fetch(`/api/participants?id=${memberId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ cover_penalty_until: null, cover_penalty_reason: null })
                    })
                    showToast('커버 페널티 해제 완료!')
                    onUpdate?.()
                  }} className="text-xs bg-gray-500 text-white rounded px-2 py-1">해제+제외</button>
                </div>
              </div>
            </div>          
          )}
          {participations
            .filter(p => p.projects?.status === 'ONGOING' && p.status === 'ACTIVE')
            .map(p => {
              const projectPosts = posts.filter(post => post.project_code?.toLowerCase() === p.project_code?.toLowerCase())
              const coverApproved = p.cover_status === 'APPROVED'
              
              if (coverApproved) {
                // 커버 승인자: 15일 기준
                if (projectPosts.filter((post: any) => post.is_cover).length === 0) {
                  const startDate = new Date(p.projects?.start_date)
                  const deadline = new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000)
                  const daysLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  if (daysLeft > 0) return (
                    <div key={p.id} className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-purple-700">🎵 {p.project_code} 커버영상 미제출</p>
                      <p className="text-xs text-gray-500 mt-1">커버 페널티까지 {daysLeft}일 남음</p>
                    </div>
                  )
                }
              } else {
                // 일반 체험단: 48시간 기준
                if (projectPosts.length === 0) {
                  const startDate = new Date(p.projects?.start_date)
                  const deadline = new Date(startDate.getTime() + 48 * 60 * 60 * 1000)
                  const hoursLeft = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60))
                  if (hoursLeft > 0) return (
                    <div key={p.id} className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-700">⏰ {p.project_code} 미션 미제출</p>
                      <p className="text-xs text-gray-500 mt-1">밴까지 {hoursLeft}시간 남음</p>
                    </div>
                  )
                }
              }
              return null
            })}
          {!participant?.banned_until && !participant?.is_locked && !participant?.cover_penalty_until && (
            <p className="text-sm text-gray-400 text-center py-2">페널티 없음</p>
          )}
        </div>
      )}
    </div>
  )
}

function ClientProjects({ clientId }: { clientId: string }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/projects?client_id=${clientId}`)
      const data = await res.json()
      setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) return <p className="text-sm text-gray-400 text-center py-4">로딩 중...</p>

  return (
    <div className="space-y-2">
      {projects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">진행 프로젝트 없음</p>
      ) : (
        projects.map(p => (
          <div key={p.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">{p.artist_name || p.client_name} - {p.song_title ?? p.product_content}</p>
                <p className="text-xs text-gray-500">코드: {p.project_code}</p>
                <p className="text-xs text-gray-500">기간: {p.start_date ?? '미정'} ~ {p.end_date ?? '미정'}</p>
                <p className="text-xs text-gray-500">참여: {p.current_participants}/{p.max_participants}명</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${p.status === 'ONGOING' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.status === 'ONGOING' ? '진행중' : p.status === 'PENDING' ? '대기중' : '완료'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function Page4() {
  const [tab, setTab] = useState<'participant' | 'client'>('participant')
  
  const [participants, setParticipants] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [selectedReferredUsers, setSelectedReferredUsers] = useState<any[]>([])
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [password, setPassword] = useState('')
  const [level, setLevel] = useState(1)
  const [coverReward, setCoverReward] = useState<number | ''>('')
  const [rewardSelected, setRewardSelected] = useState<number[]>([])
  const [rewardAmount, setRewardAmount] = useState('')
  const [rewardMemo, setRewardMemo] = useState('')  

  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [cName, setCName] = useState('')
  const [cCompany, setCCompany] = useState('')
  const [cArtist, setCArtist] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cMobile, setCMobile] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cProjectCode, setCProjectCode] = useState('')
  const [showClientInsert, setShowClientInsert] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientCompany, setNewClientCompany] = useState('')
  const [newClientArtist, setNewClientArtist] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientMobile, setNewClientMobile] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [showParticipantInsert, setShowParticipantInsert] = useState(false)
  const [memberPosts, setMemberPosts] = useState<any[]>([])
  const [memberCommentMissions, setMemberCommentMissions] = useState<any[]>([])
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [participantPage, setParticipantPage] = useState(0)
  const [clientPage, setClientPage] = useState(0)
  const [coverFilter, setCoverFilter] = useState('all')
  const [artistList, setArtistList] = useState<any[]>([])
  const [newArtistName, setNewArtistName] = useState('')
  const [snsRequests, setSnsRequests] = useState<any[]>([])
  const [allPendingSnsRequests, setAllPendingSnsRequests] = useState<any[]>([])
  const [bannedMemberIds, setBannedMemberIds] = useState<number[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [memberDetailTab, setMemberDetailTab] = useState<'activity' | 'info'>('activity')
  const [clientDetailTab, setClientDetailTab] = useState<'projects' | 'info'>('projects')
  const PAGE_SIZE = 10

  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchParticipants() 
    fetchClients()
  }, [])

  const fetchParticipants = async () => {
    const res = await fetch('/api/participants')
    const data = await res.json()
    setParticipants(data ?? [])
    const snsRes = await fetch('/api/sns_change_requests?status=PENDING')
    const snsData = await snsRes.json()
    setAllPendingSnsRequests(Array.isArray(snsData) ? snsData : [])
    const bannedRes = await fetch('/api/project_participants?status=BANNED')
    const bannedData = await bannedRes.json()
    setBannedMemberIds(Array.isArray(bannedData) ? [...new Set(bannedData.filter((p: any) => !p.is_cover).map((p: any) => p.member_id))] as number[] : [])
  }

  const fetchArtists = async (client_id: string) => {
  const res = await fetch(`/api/artists?client_id=${client_id}`)
  const data = await res.json()
  setArtistList(data)
  }

  const fetchClients = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setClients(data ?? [])
  }

  const handleSelect = async (p: any) => {
    setSelected(p)
    setSelectedReferredUsers([])
    if (p?.referral_code) {
      fetch(`/api/participants?referred_by=${p.referral_code}`)
        .then(r => r.json())
        .then(d => setSelectedReferredUsers(Array.isArray(d) ? d : []))
        .catch(() => {})
    }
    setExpandedCard(null)
    setName(p.name ?? ''); setMobile(p.mobile ?? ''); setEmail(p.email ?? '')
    setBankName(p.bank_name ?? ''); setAccountHolder(p.account_holder ?? '')
    setInstagram(p.instagram_id ?? '')
    setYoutube(p.youtube_id ?? ''); setTiktok(p.tiktok_id ?? '')
    setPassword(''); setLevel(p.level ?? 1); setCoverReward(p.cover_reward ?? '')
    
    // 계좌번호 복호화
    const decrypted = p.account_number ? await decryptText(p.account_number) : ''
    setAccountNumber(decrypted)

    // 게시물 + 댓글 미션 가져오기
    supabase.from('posts').select('*').eq('member_id', p.id).order('created_at', { ascending: false })
      .then(({ data }) => setMemberPosts(data ?? []))
    supabase.from('comment_missions').select('*').eq('member_id', p.id).eq('status', 'APPROVED')
      .then(({ data }) => setMemberCommentMissions(data ?? []))

    // SNS 변경 요청 불러오기
    const snsRes = await fetch(`/api/sns_change_requests?member_id=${p.id}`)
    const snsData = await snsRes.json()
    setSnsRequests(snsData ?? [])
  }

  const clearForm = () => {
    setSelected(null)
    setName(''); setMobile(''); setEmail(''); setBankName('')
    setAccountHolder(''); setAccountNumber(''); setInstagram('')
    setYoutube(''); setTiktok(''); setPassword(''); setLevel(1)
    setShowParticipantInsert(false)
    setMemberDetailTab('activity')
  }

  const handleInsert = async () => {
    if (!name || !email || !mobile) { showToast('이름, 이메일, 휴대전화는 필수입니다.'); return }
    
    // 임시 비밀번호 생성
    const tempPassword = 'DB' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!'
    
    // 추천인 코드 생성
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let referralCode = 'DB' + Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    let isUnique = false
    while (!isUnique) {
      const res = await fetch(`/api/participants?referral_code=${referralCode}`)
      const data = await res.json()
      if (!data || data.length === 0) isUnique = true
      else referralCode = 'DB' + Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    }

    // Supabase Auth 계정 생성
    const { error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword
    })
    if (authError) {
      const errorMsg = authError.message.includes('already registered') ? '이미 가입된 이메일이에요.' : authError.message
      showToast('계정 생성 실패! ' + errorMsg)
      return
    }

    // DB에 체험단 정보 저장
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, mobile, email, bank_name: bankName,
        account_holder: accountHolder, account_number: accountNumber,
        instagram_id: instagram, youtube_id: youtube,
        tiktok_id: tiktok, password: '', level,
        referral_code: referralCode
      })
    })
    if (!res.ok) { showToast('등록 실패!'); return }

    // 임시 비밀번호 SMS 발송
    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: mobile,
        name: name,
        code: tempPassword,
        expiry: '로그인 후 변경해주세요'
      })
    })

    showToast(`등록 완료! 임시 비밀번호(${tempPassword})가 ${mobile}로 전송됐어요.`)
    fetchParticipants() 
    clearForm()
  }

  const handleUpdate = async () => {
    const updateData: any = {
      name, mobile, email,
      instagram_id: instagram, youtube_id: youtube,
      tiktok_id: tiktok, level,
      cover_reward: coverReward === '' ? null : Number(coverReward)
    }
    if (password) updateData.password = password
    const res = await fetch(`/api/participants?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { showToast('수정 실패!'); return }
    showToast('수정 완료!')
    
    // 팔로워 수 업데이트
    if (instagram) {
      try {
        const igRes = await fetch(`/api/instagram-user?username=${instagram}`)
        const igData = await igRes.json()
        if (igData.followers > 0) await fetch(`/api/participants?id=${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instagram_followers: igData.followers })
        })
      } catch {}
    }
    if (youtube) {
      try {
        const ytRes = await fetch(`/api/youtube-channel?handle=${youtube}`)
        const ytData = await ytRes.json()
        if (ytData.subscriberCount > 0) await fetch(`/api/participants?id=${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_subscribers: ytData.subscriberCount })
        })
      } catch {}
    }
    if (tiktok) {
      try {
        const ttRes = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${tiktok.replace('@','')}`, {
          headers: {
            'x-rapidapi-key': '00a17b2152msh1a098423700fc90p1d97d2jsn85e2250f9992',
            'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
          }
        })
        const ttData = await ttRes.json()
        const followers = ttData?.data?.stats?.followerCount ?? 0
        if (followers > 0) await fetch(`/api/participants?id=${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tiktok_followers: followers })
        })
      } catch {}
    }
    fetchParticipants() 
  }

  const handleDelete = async () => {
    if (!confirm('탈퇴 시 추천인의 적립금 150P와 레벨 1이 차감됩니다. 정말 삭제하시겠습니까?')) return
    
    // 추천인 적립금/레벨 차감
    if (selected.referred_by) {
      const referrerRes = await fetch(`/api/participants?referral_code=${selected.referred_by}`)
      const referrerData = await referrerRes.json()
      const referrer = referrerData?.[0]
      if (referrer) {
        const newBalance = Math.max(0, (referrer.balance ?? 0) - 150)
        const newLevel = Math.max(1, (referrer.level ?? 1) - 1)
        await fetch(`/api/participants?id=${referrer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: newBalance, level: newLevel })
        })
      }
    }

    // 소프트 삭제
    const res = await fetch(`/api/participants?id=${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_deleted: true, balance: 0 })
    })
    if (!res.ok) { showToast('삭제 실패!'); return }
    showToast('삭제 완료!')
    fetchParticipants() 
    clearForm()
  }

  const handleSelectClient = (c: any) => {
    setSelectedClient(c)
    setCName(c.name ?? ''); setCCompany(c.company ?? ''); setCArtist(c.artist ?? '')
    setCPhone(c.phone ?? ''); setCMobile(c.mobile ?? ''); setCEmail(c.email ?? '')
    setCPassword(''); setCProjectCode(c.project_code ?? '')
    fetchArtists(c.client_id)
  }

  const clearClientForm = () => {
    setSelectedClient(null)
    setCName(''); setCCompany(''); setCArtist(''); setCPhone('')
    setCMobile(''); setCEmail(''); setCPassword(''); setCProjectCode('')
    setArtistList([])
    setNewArtistName('')
  }

  const generateClientId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return 'CL' + Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleInsertClient = async () => {
    if (!newClientName || !newClientEmail || !newClientMobile) { showToast('이름, 이메일, 휴대전화는 필수입니다.'); return }
    
    // 임시 비밀번호 생성
    const tempPassword = 'DB' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!'
    
    // 의뢰인 코드 생성
    let clientId = generateClientId()
    let isUnique = false
    while (!isUnique) {
      const res = await fetch(`/api/users?client_id=${clientId}`)
      const data = await res.json()
      if (!data || data.length === 0) isUnique = true
      else clientId = generateClientId()
    }

    // Supabase Auth 계정 생성
    const { error: authError } = await supabase.auth.signUp({
      email: newClientEmail,
      password: tempPassword
    })
    if (authError) {
      const errorMsg = authError.message.includes('already registered') ? '이미 가입된 이메일이에요.' : authError.message
      showToast('계정 생성 실패! ' + errorMsg)
      return
    }

    // DB에 의뢰인 정보 저장
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClientName, company: newClientCompany, artist: newClientArtist,
        phone: newClientPhone, mobile: newClientMobile, email: newClientEmail,
        role: 'client', client_id: clientId
      })
    })
    if (!res.ok) { showToast('등록 실패!'); return }

    // 임시 비밀번호 SMS 발송
    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: newClientMobile,
        name: newClientName,
        code: tempPassword,
        expiry: '로그인 후 변경해주세요'
      })
    })

    showToast(`등록 완료! 의뢰인 코드: ${clientId}\n임시 비밀번호(${tempPassword})가 ${newClientMobile}로 전송됐어요.`)
    setShowClientInsert(false)
    setNewClientName(''); setNewClientCompany(''); setNewClientArtist('')
    setNewClientPhone(''); setNewClientMobile(''); setNewClientEmail('')
    fetchClients()
  }

  const handleUpdateClient = async () => {
    const updateData: any = {
      name: cName, company: cCompany, artist: cArtist,
      phone: cPhone, mobile: cMobile, email: cEmail,
      project_code: cProjectCode || null
    }
    if (cPassword) updateData.password = cPassword
    const res = await fetch(`/api/users?id=${selectedClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    if (!res.ok) { showToast('수정 실패!'); return }
    if (cProjectCode && selectedClient.client_id) {
      await fetch(`/api/projects?project_code=${cProjectCode.toUpperCase()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClient.client_id })
      })
    }
    showToast('수정 완료!')
    fetchClients()
  }

  const handleDeleteClient = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/users?id=${selectedClient.id}`, { method: 'DELETE' })
    if (!res.ok) { showToast('삭제 실패!'); return }
    showToast('삭제 완료!')
    fetchClients()
    clearClientForm()
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleRefresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await fetchParticipants() 
    await fetchClients()
    setIsRefreshing(false)
  }

  const filteredParticipants = participants.filter(p => {
    if (coverFilter === 'cover') return p.is_cover_possible
    if (coverFilter === 'normal') return !p.is_cover_possible
    if (participantSearch) {
      const s = participantSearch.toLowerCase()
      return p.name?.toLowerCase().includes(s) || 
             p.email?.toLowerCase().includes(s) || 
             p.mobile?.includes(s) ||
             p.instagram_id?.toLowerCase().includes(s) ||
             p.youtube_id?.toLowerCase().includes(s) ||
             p.tiktok_id?.toLowerCase().includes(s)
    }
    return true
  })

  const filteredClients = clients.filter(c => {
  if (!clientSearch) return true
  const s = clientSearch.toLowerCase()
  return c.name?.toLowerCase().includes(s) ||
         c.email?.toLowerCase().includes(s) ||
         c.mobile?.includes(s) ||
         c.company?.toLowerCase().includes(s)
  })

  return (
    <>
      <Sidebar
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onLogout={handleLogout}
        items={[
          { icon: '📋', label: '프로젝트', onClick: () => router.push('/admin') },
          { icon: '🏢', label: '의뢰인', onClick: () => router.push('/client') },
          { icon: '👤', label: '회원관리', onClick: () => router.push('/members'), active: true },
          { icon: '💰', label: '정산', onClick: () => router.push('/settlement') },
          { icon: '🎵', label: '커버', onClick: () => router.push('/cover') },
          { icon: '👤', label: '마이페이지', onClick: () => router.push('/admin-mypage') },
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
      <div className="max-w-7xl mx-auto">
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
          <div className="flex justify-center mb-2">
            <img src="/DBMUSIC_HEADER.svg" alt="DBMUSIC" className="h-7 cursor-pointer" onClick={() => router.push('/admin')} />
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="hidden md:block text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">회원 관리</h1>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { setTab('participant'); clearForm(); clearClientForm() }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === 'participant' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>체험단</button>
          <button onClick={() => { setTab('client'); clearForm(); clearClientForm() }} className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === 'client' ? 'bg-green-600 text-white' : 'bg-white border'}`}>의뢰인</button>
        </div>

        <div className="md:grid md:grid-cols-2 md:gap-4">
          {/* 왼쪽 - 목록 */}
          <div>
            {tab === 'participant' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">💰 적립금 지급</h2>
                <div className="space-y-3">
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => {
                      if (rewardSelected.length === filteredParticipants.length) setRewardSelected([])
                      else setRewardSelected(filteredParticipants.map((p: any) => p.id))
                    }} className="text-xs border rounded px-2 py-1">
                      {rewardSelected.length === filteredParticipants.length ? '전체 해제' : '전체 선택'}
                    </button>
                    <span className="text-xs text-gray-500 self-center">{rewardSelected.length}명 선택</span>
                  </div>
                  <input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="지급 금액 입력" />
                  <input value={rewardMemo} onChange={(e) => setRewardMemo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="메모 입력 (예: 가입 축하금)" />
                  <button onClick={async () => {
                    if (rewardSelected.length === 0) { showToast('체험단을 선택해주세요.', 'error'); return }
                    if (!rewardAmount) { showToast('금액을 입력해주세요.', 'error'); return }
                    const amount = Number(rewardAmount)
                    for (const id of rewardSelected) {
                      const p = filteredParticipants.find((p: any) => p.id === id)
                      if (!p) continue
                      if (amount < 0 && (p.balance ?? 0) + amount < 0) {
                        showToast(`${p.name}님의 잔액이 부족해요.`, 'error')
                        continue
                      }
                      await fetch(`/api/participants?id=${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ balance: (p.balance ?? 0) + amount })
                      })
                      // 포인트 내역 저장
                      await fetch('/api/point_history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ member_id: id, amount, memo: rewardMemo || '관리자 지급' })
                      })
                      // 푸시 알림
                      const tokensRes = await fetch(`/api/push_tokens?user_id=${String(id)}`)
                      const tokens = await tokensRes.json()
                      if (tokens?.length > 0) {
                        await fetch('/api/push', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: '💰 적립금이 지급됐어요!',
                            body: `${rewardMemo || '관리자 지급'}: ${amount.toLocaleString()}P가 지급됐어요!`,
                            tokens: tokens.map((t: any) => t.token),
                            userIds: [String(id)]
                          })
                        })
                      }
                    }
                    showToast(`${rewardSelected.length}명에게 ${amount.toLocaleString()}P 지급 완료!`)
                    setRewardSelected([])
                    setRewardAmount('')
                    setRewardMemo('')
                    fetchParticipants() 
                  }} className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium">지급하기</button>
                </div>
              </div>
            )}
            {tab === 'participant' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">체험단 목록 <span className="text-sm text-gray-500 font-normal">({filteredParticipants.length}명)</span></h2>
                  <div className="flex gap-1">
                    <button onClick={() => setCoverFilter('all')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : ''}`}>전체</button>
                    <button onClick={() => setCoverFilter('cover')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'cover' ? 'bg-purple-600 text-white border-purple-600' : ''}`}>커버가능</button>
                    <button onClick={() => setCoverFilter('normal')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'normal' ? 'bg-gray-600 text-white border-gray-600' : ''}`}>일반회원</button>
                  </div>
                </div>
                <input 
                  value={participantSearch} 
                  onChange={(e) => { setParticipantSearch(e.target.value); setParticipantPage(0) }} 
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3" 
                  placeholder="이름, 이메일, 연락처, SNS ID 검색" 
                />
                
                {filteredParticipants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">회원이 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {filteredParticipants.slice(participantPage * PAGE_SIZE, (participantPage + 1) * PAGE_SIZE).map((p) => (
                        <div key={p.id} className={`border rounded-lg cursor-pointer ${selected?.id === p.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <div className="p-3" onClick={() => {
                            if (expandedCard !== p.id) clearForm()
                            setExpandedCard(expandedCard === p.id ? null : p.id)
                          }}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={rewardSelected.includes(p.id)} onChange={() => {}} onClick={(e) => {
                                  e.stopPropagation()
                                  setRewardSelected(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])
                                }} className="cursor-pointer" />
                                <div className="flex items-center gap-1 flex-wrap">
                                  <p className="font-medium text-sm">{p.name}</p>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Lv.{p.level ?? 1}</span>
                                  {p.is_cover_possible && <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">🎵 커버가능</span>}
                                  {p.cover_approved && <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">✅ 승인</span>}
                                  {bannedMemberIds.includes(p.id) && <span className="text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">🚫 밴</span>}
                                  {p.cover_penalty_until && new Date(p.cover_penalty_until) > new Date() && <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded">⚠️ 커버페널티</span>}
                                  {p.is_cover_possible && !p.cover_approved && <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">⏳ 커버승인대기</span>}
                                  {allPendingSnsRequests.some(r => r.member_id === p.id) && <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">📱 SNS변경대기</span>}
                                  {p.is_locked && <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded">🔒 잠금</span>}
                                </div>
                              </div>
                              <p className="text-sm font-medium text-blue-600 shrink-0">{p.balance?.toLocaleString() ?? 0}P</p>
                            </div>
                          </div>
                          {expandedCard === p.id && (
                            <div className="px-3 pb-3 border-t pt-2 space-y-1">
                              <p className="text-xs text-gray-500">{p.email}</p>
                              <p className="text-xs text-gray-500">{p.mobile}</p>
                              {p.instagram_id && <a href={`https://www.instagram.com/${p.instagram_id.replace('@','')}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs text-gray-500 flex items-center gap-1">
                                <PlatformIcon platform="instagram" size={12} />{p.instagram_id} ({p.instagram_followers?.toLocaleString() ?? '-'}명)
                              </a>}
                              {p.youtube_id && <a href={`https://www.youtube.com/@${p.youtube_id.replace('@','')}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs text-gray-500 flex items-center gap-1">                              
                                <PlatformIcon platform="youtube" size={12} />{p.youtube_id} ({p.youtube_subscribers?.toLocaleString() ?? '-'}명)
                              </a>}
                              {p.tiktok_id && <a href={`https://www.tiktok.com/@${p.tiktok_id.replace('@','')}`} target="_blank" onClick={(e) => e.stopPropagation()} className="text-xs text-gray-500 flex items-center gap-1">
                                <PlatformIcon platform="tiktok" size={12} />{p.tiktok_id} ({p.tiktok_followers?.toLocaleString() ?? '-'}명)
                              </a>}
                              <p className="text-xs text-gray-400">가입일: {new Date(p.created_at).toLocaleDateString('ko-KR')}</p>
                              <div className="mt-2">
                                <textarea
                                  id={`memo-${p.id}`}
                                  defaultValue={p.admin_memo ?? ''}
                                  placeholder="관리자 메모..."
                                  rows={2}
                                  className="w-full border rounded-lg px-2 py-1 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={async (e) => {
                                  e.stopPropagation()
                                  const memo = (document.getElementById(`memo-${p.id}`) as HTMLTextAreaElement)?.value
                                  await fetch(`/api/participants?id=${p.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ admin_memo: memo })
                                  })
                                  showToast('메모 저장 완료!')
                                }} className="w-full mt-1 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-600">메모 저장</button>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleSelect(p) }} className="w-full mt-2 bg-blue-600 text-white rounded-lg py-1.5 text-xs font-medium">정보수정</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {filteredParticipants.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setParticipantPage(p => Math.max(0, p - 1))} disabled={participantPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(filteredParticipants.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setParticipantPage(i)} className={`text-xs px-2 py-1 border rounded ${participantPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setParticipantPage(p => Math.min(Math.ceil(filteredParticipants.length / PAGE_SIZE) - 1, p + 1))} disabled={(participantPage + 1) * PAGE_SIZE >= filteredParticipants.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'client' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">의뢰인 목록 <span className="text-sm text-gray-500 font-normal">({filteredClients.length}명)</span></h2>
                <input 
                  value={clientSearch} 
                  onChange={(e) => { setClientSearch(e.target.value) }} 
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3" 
                  placeholder="이름, 이메일, 연락처 검색" 
                />
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">의뢰인이 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {filteredClients.slice(clientPage * PAGE_SIZE, (clientPage + 1) * PAGE_SIZE).map((c) => (
                        <div key={c.id} onClick={() => selectedClient?.id === c.id ? clearClientForm() : handleSelectClient(c)} className={`border rounded-lg p-3 cursor-pointer ${selectedClient?.id === c.id ? 'border-green-500 bg-green-50' : ''}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.company} {c.artist ? `· ${c.artist}` : ''}</p>
                              <p className="text-xs text-gray-400">{c.email}</p>
                            </div>
                            <div className="text-right">
                              {c.client_id && <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">{c.client_id}</span>}
                              {c.project_code && <p className="text-xs text-gray-500 mt-1">{c.project_code}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredClients.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setClientPage(p => Math.max(0, p - 1))} disabled={clientPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <div className="flex gap-1">
                          {Array.from({length: Math.ceil(filteredClients.length / PAGE_SIZE)}, (_, i) => (
                            <button key={i} onClick={() => setClientPage(i)} className={`text-xs px-2 py-1 border rounded ${clientPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                          ))}
                        </div>
                        <button onClick={() => setClientPage(p => Math.min(Math.ceil(filteredClients.length / PAGE_SIZE) - 1, p + 1))} disabled={(clientPage + 1) * PAGE_SIZE >= filteredClients.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 - 등록/수정 */}
          <div>
            {tab === 'participant' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">{selected ? '체험단 수정' : '체험단 등록'}</h2>
                  <div className="flex gap-2 mt-3">
                    {selected && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
                    {!selected && <button onClick={() => setShowParticipantInsert(!showParticipantInsert)} className="text-xs border rounded px-2 py-1">
                      {showParticipantInsert ? '접기 ▲' : '펼치기 ▼'}
                    </button>}
                  </div>
                </div>
                {selected && (
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setMemberDetailTab('activity')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${memberDetailTab === 'activity' ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>활동 내역</button>
                    <button onClick={() => setMemberDetailTab('info')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${memberDetailTab === 'info' ? 'bg-blue-600 text-white' : 'border text-gray-500'}`}>정보 수정</button>                    
                  </div>
                )}
                {(selected || showParticipantInsert) && (memberDetailTab === 'info' || !selected) && (
                  <div className="space-y-3">
                    {[
                      { label: '이름 *', value: name, setter: setName },
                      { label: '휴대전화 *', value: mobile, setter: setMobile },
                      { label: '이메일 *', value: email, setter: setEmail, type: 'email' },
                      { label: '인스타그램 ID', value: instagram, setter: setInstagram },
                      { label: '유튜브 ID', value: youtube, setter: setYoutube },
                      { label: '틱톡 ID', value: tiktok, setter: setTiktok },
                    ].map(({ label, value, setter, type }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">
                          {label.replace(' *', '')}
                          {label.includes('*') && <span className="text-red-500"> *</span>}
                        </label>
                        <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                    <div>
                      <label className="text-sm font-medium">등급 (레벨)</label>
                      <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                        {Array.from({length: 50}, (_, i) => i + 1).map(lv => (
                          <option key={lv} value={lv}>Lv.{lv} ({lv === 50 ? '10,000P' : `${(2500 + (lv-1) * 150).toLocaleString()}P`})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selected?.is_cover_possible ?? false} onChange={async (e) => {
                        const checked = e.target.checked
                        await fetch(`/api/participants?id=${selected.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_cover_possible: checked })
                        })
                        setSelected((prev: any) => ({ ...prev, is_cover_possible: checked }))
                        setParticipants((prev: any[]) => prev.map(p => p.id === selected.id ? { ...p, is_cover_possible: checked } : p))
                      }} />
                      <label className="text-sm font-medium">커버가능 체험단</label>
                    </div>
                    {selected?.is_cover_possible && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-700 mb-2">🎵 커버영상 신청</p>
                        {selected.cover_video_url && (
                          <a href={selected.cover_video_url} target="_blank" className="text-xs text-blue-500 block mb-2">영상 링크 보기 →</a>
                        )}
                        <div className="mt-2">
                          <label className="text-xs font-medium text-purple-700">영상 링크 등록</label>
                          <div className="flex gap-2 mt-1">
                            <input defaultValue={selected?.cover_video_url ?? ''} id="cover_url_input" className="flex-1 border rounded-lg px-2 py-1 text-xs" placeholder="영상 링크 입력" />
                            <button onClick={async () => {
                              const url = (document.getElementById('cover_url_input') as HTMLInputElement)?.value
                              await fetch(`/api/participants?id=${selected.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ cover_video_url: url })
                              })
                              showToast('링크 저장 완료!')
                              fetchParticipants() 
                            }} className="text-xs bg-purple-600 text-white rounded px-2 py-1">저장</button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-medium text-purple-700 mb-1">장르</p>
                          <div className="grid grid-cols-2 gap-1">
                            {['발라드', '댄스/팝', 'R&B', '힙합', '트로트', '록/밴드', '인디', '기타'].map(genre => (
                              <label key={genre} className="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="checkbox" 
                                  checked={(selected?.genres ?? []).includes(genre)} 
                                  onChange={async (e) => {
                                    const newGenres = e.target.checked 
                                      ? [...(selected?.genres ?? []), genre]
                                      : (selected?.genres ?? []).filter((g: string) => g !== genre)
                                    await fetch(`/api/participants?id=${selected.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ genres: newGenres })
                                    })
                                    setSelected({...selected, genres: newGenres})
                                    fetchParticipants() 
                                  }} 
                                  className="w-3 h-3" />
                                {genre}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={async () => {
                            await fetch(`/api/participants?id=${selected.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ cover_approved: true })
                            })
                            const tokensRes = await fetch(`/api/push_tokens?user_id=${String(selected.id)}`)
                            const tokens = await tokensRes.json()
                            if (tokens && tokens.length > 0) {
                              await fetch('/api/push', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: '🎵 커버영상 촬영 승인됐어요!',
                                  body: '커버가능 회원으로 승인됐어요. 이제 커버영상 미션에 참여할 수 있어요!',
                                  tokens: tokens.map((t: any) => t.token),
                                  userIds: tokens.map((t: any) => t.user_id)
                                })
                              })
                            }
                            showToast('커버영상 승인 완료!')
                            setSelected((prev: any) => ({ ...prev, cover_approved: true }))
                            fetchParticipants() 
                          }} className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-xs font-medium">승인</button>
                          <button onClick={async () => {
                            await fetch(`/api/participants?id=${selected.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ cover_approved: false, is_cover_possible: false })
                            })
                            const tokensRes = await fetch(`/api/push_tokens?user_id=${String(selected.id)}`)
                            const tokens = await tokensRes.json()
                            if (tokens && tokens.length > 0) {
                              await fetch('/api/push', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: '커버영상 촬영 신청 결과',
                                  body: '아쉽게도 커버가능 회원으로 승인되지 않았어요. 일반 체험단으로 활동 가능합니다.',
                                  tokens: tokens.map((t: any) => t.token),
                                  userIds: tokens.map((t: any) => t.user_id)
                                })
                              })
                            }
                            showToast('승인 취소 완료!')
                            setSelected((prev: any) => ({ ...prev, cover_approved: false, is_cover_possible: false }))
                            fetchParticipants() 
                          }} className="flex-1 bg-gray-400 text-white rounded-lg py-2 text-xs font-medium">승인취소</button>
                        </div>
                      </div>
                    )}
                    {snsRequests.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">📱 SNS 계정 변경 요청</p>
                        <div className="space-y-2">
                          {snsRequests.map((req) => (
                            <div key={req.id} className="border border-blue-200 rounded-lg p-2 bg-white">
                              <p className="text-xs text-gray-500">{req.platform} · {new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                              <p className="text-xs">{req.old_id} → <a href={
                                req.platform === 'instagram' ? `https://www.instagram.com/${req.new_id.replace('@','')}` :
                                req.platform === 'youtube' ? `https://www.youtube.com/@${req.new_id.replace('@','')}` :
                                req.platform === 'tiktok' ? `https://www.tiktok.com/@${req.new_id.replace('@','')}` : '#'
                              } target="_blank" className="font-bold text-blue-600 underline">{req.new_id}</a></p>
                              <div className="flex gap-2 mt-2">
                                {req.status === 'PENDING' ? (
                                  <>
                                    <button onClick={async () => {
                                      await fetch(`/api/sns_change_requests?id=${req.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'APPROVED' })
                                      })
                                      // participants 테이블 업데이트
                                      await fetch(`/api/participants?id=${selected.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ [`${req.platform}_id`]: req.new_id })
                                      })
                                      setSnsRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'APPROVED'} : r))
                                      setSelected((prev: any) => ({...prev, [`${req.platform}_id`]: req.new_id}))
                                      showToast('승인됐어요!')
                                      fetchParticipants() 
                                    }} className="flex-1 bg-blue-600 text-white rounded-lg py-1 text-xs">승인</button>
                                    <button onClick={async () => {
                                      await fetch(`/api/sns_change_requests?id=${req.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'REJECTED' })
                                      })
                                      setSnsRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'REJECTED'} : r))
                                      showToast('거절됐어요.')
                                    }} className="flex-1 bg-gray-400 text-white rounded-lg py-1 text-xs">거절</button>
                                  </>
                                ) : (
                                  <span className={`text-xs px-2 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {req.status === 'APPROVED' ? '승인됨' : '거절됨'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {selected ? (
                        <>
                          <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정</button>
                          <button onClick={handleDelete} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">삭제</button>
                        </>
                      ) : (
                        <button onClick={handleInsert} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">체험단 등록</button>
                      )}
                    </div>
                  </div>
                )}
                {selected && memberDetailTab === 'activity' && (
                  <ActivityDetail memberId={selected.id} onUpdate={fetchParticipants} />
                )}
              </div>
            )}

            {/* 수익 내역 */}
            {tab === 'participant' && selected && (memberPosts.length > 0 || memberCommentMissions.length > 0) && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h3 className="font-bold mb-3">💰 수익 내역</h3>
                
                {memberPosts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">📸 게시물 수익</p>
                    <div className="space-y-1">
                      {memberPosts.map((post) => {
                        const levelReward = level === 50 ? 10000 : 2500 + (level - 1) * 150
                        return (
                          <div key={post.id} className="flex justify-between text-xs border rounded p-2">
                            <span>{post.platform} · {post.project_code}</span>
                            <span className="text-blue-600 font-medium">{levelReward.toLocaleString()}P</span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between text-xs font-bold bg-blue-50 rounded p-2">
                        <span>게시물 수익 합계</span>
                        <span className="text-blue-600">{(memberPosts.length * (level === 50 ? 10000 : 2500 + (level - 1) * 150)).toLocaleString()}P</span>
                      </div>
                    </div>
                  </div>
                )}

                {memberCommentMissions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">💬 댓글 미션 수익</p>
                    <div className="space-y-1">
                      {memberCommentMissions.map((m) => (
                        <div key={m.id} className="flex justify-between text-xs border rounded p-2">
                          <span>{m.project_code} · {m.youtube_handle}</span>
                          <span className="text-green-600 font-medium">300P</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold bg-green-50 rounded p-2">
                        <span>댓글 수익 합계</span>
                        <span className="text-green-600">{(memberCommentMissions.length * 300).toLocaleString()}P</span>
                      </div>
                    </div>
                  </div>
                )}

                {selected?.cover_reward && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">🎵 커버영상 수익</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs border rounded p-2">
                        <span>커버영상 별도 지급</span>
                        <span className="text-purple-600 font-medium">{Number(selected.cover_reward).toLocaleString()}P</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReferredUsers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">🎯 추천인 수익</p>
                    <div className="space-y-1">
                      {selectedReferredUsers.map((u: any) => (
                        <div key={u.id} className="flex justify-between text-xs border rounded p-2">
                          <span>추천인 보상 ({u.name})</span>
                          <span className="text-orange-600 font-medium">150P</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold bg-orange-50 rounded p-2">
                        <span>추천인 수익 합계</span>
                        <span className="text-orange-600">{(selectedReferredUsers.length * 150).toLocaleString()}P</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold bg-gray-100 rounded p-2">
                  <span>총 수익</span>
                  <span className="text-blue-600">
                    {(memberPosts.length * (level === 50 ? 10000 : 2500 + (level - 1) * 150) + memberCommentMissions.length * 300 + (selected?.cover_reward ? Number(selected.cover_reward) : 0) + selectedReferredUsers.length * 150).toLocaleString()}P
                  </span>
                </div>
              </div>
            )}

            {tab === 'client' && !selectedClient && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">의뢰인 등록</h2>
                  <button onClick={() => setShowClientInsert(!showClientInsert)} className="text-xs border rounded px-2 py-1">
                    {showClientInsert ? '접기 ▲' : '펼치기 ▼'}
                  </button>
                </div>
                {showClientInsert && (
                  <div className="space-y-3">
                    {[
                      { label: '대표자명 *', value: newClientName, setter: setNewClientName },
                      { label: '소속사명', value: newClientCompany, setter: setNewClientCompany },
                      { label: '휴대전화 *', value: newClientMobile, setter: setNewClientMobile },
                      { label: '이메일 *', value: newClientEmail, setter: setNewClientEmail, type: 'email' },
                    ].map(({ label, value, setter, type }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">
                          {label.replace(' *', '')}
                          {label.includes('*') && <span className="text-red-500"> *</span>}
                        </label>
                        <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                    <button onClick={handleInsertClient} className="w-full bg-green-600 text-white rounded-lg py-2 font-medium">의뢰인 등록</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'client' && selectedClient && (
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">의뢰인 수정</h2>
                  <button onClick={clearClientForm} className="text-xs text-gray-500 border rounded px-2 py-1">닫기</button>
                </div>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setClientDetailTab('projects')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${clientDetailTab === 'projects' ? 'bg-green-600 text-white' : 'border text-gray-500'}`}>프로젝트 현황</button>
                  <button onClick={() => setClientDetailTab('info')} className={`flex-1 py-1.5 text-xs rounded-lg font-medium ${clientDetailTab === 'info' ? 'bg-green-600 text-white' : 'border text-gray-500'}`}>정보 수정</button>                  
                </div>
                {clientDetailTab === 'info' && (
                  <div className="space-y-3">
                    {[
                      { label: '대표자명', value: cName, setter: setCName },
                      { label: '소속사명', value: cCompany, setter: setCCompany },
                      { label: '휴대전화', value: cMobile, setter: setCMobile },
                      { label: '이메일', value: cEmail, setter: setCEmail, type: 'email' },
                    ].map(({ label, value, setter, type }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">
                          {label.replace(' *', '')}
                          {label.includes('*') && <span className="text-red-500"> *</span>}
                        </label>
                        <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                      </div>
                    ))}
                  {/* 아티스트 목록 */}
                  <div>
                    <label className="text-sm font-medium">아티스트 목록</label>
                    <div className="space-y-2 mt-1">
                      {artistList.map((a) => (
                        <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-sm">{a.artist_name}</span>
                          <button onClick={async () => {
                            await fetch(`/api/artists?id=${a.id}`, { method: 'DELETE' })
                            fetchArtists(selectedClient.client_id)
                          }} className="text-xs text-red-400">삭제</button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-3">
                        <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="아티스트명 입력" />
                        <button onClick={async () => {
                          if (!newArtistName) return
                          await fetch('/api/artists', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ client_id: selectedClient.client_id, artist_name: newArtistName })
                          })
                          setNewArtistName('')
                          fetchArtists(selectedClient.client_id)
                        }} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
                      </div>
                    </div>
                  </div>
                  {selectedClient.client_id && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">의뢰인 코드: <span className="font-bold text-green-600">{selectedClient.client_id}</span></p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleUpdateClient} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium">정보 수정</button>
                    <button onClick={handleDeleteClient} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium">삭제</button>
                  </div>
                </div>
                )}
                {clientDetailTab === 'projects' && (
                  <ClientProjects clientId={selectedClient.client_id} />
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      <AdminBottomNav active="members" />
    </div>
    </>
  )
}