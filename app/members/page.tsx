'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { decryptText, encryptText } from '../lib/crypto'
import { RefreshCw, ArrowDown } from 'lucide-react'

function ActivityDetail({ memberId }: { memberId: number }) {
  const [activityTab, setActivityTab] = useState<'missions' | 'points' | 'penalty'>('missions')
  const [participations, setParticipations] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [settlements, setSettlements] = useState<any[]>([])
  const [participant, setParticipant] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [partRes, postRes, settleRes, memberRes] = await Promise.all([
        fetch(`/api/project_participants?member_id=${memberId}`),
        fetch(`/api/posts?member_id=${memberId}`),
        fetch(`/api/settlements?member_id=${memberId}`),
        fetch(`/api/participants?id=${memberId}`)
      ])
      setParticipations(await partRes.json())
      setPosts(await postRes.json())
      setSettlements(await settleRes.json())
      const data = await memberRes.json()
      setParticipant(data?.[0])
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
                    <p className="text-sm font-medium">{p.project_code}</p>
                    <p className="text-xs text-gray-500">참여일: {new Date(p.joined_at).toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-gray-500">게시물: {projectPosts.length}개</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : p.projects?.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {p.status === 'CANCELLED' ? '취소' : p.projects?.status === 'COMPLETED' ? '완료' : '진행중'}
                  </span>
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
        </div>
      )}

      {activityTab === 'penalty' && (
        <div className="space-y-2">
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
                  alert('잠금 해제 완료!')
                }} className="text-xs bg-green-600 text-white rounded px-2 py-1">잠금 해제</button>
              )}
            </div>
          </div>
          {participant?.banned_until && new Date(participant.banned_until) > new Date() && (
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-red-600">🚫 활동 제한 중</p>
                  <p className="text-xs text-gray-500 mt-1">해제일: {new Date(participant.banned_until).toLocaleDateString('ko-KR')}</p>
                  <p className="text-xs text-gray-500">남은 기간: {Math.ceil((new Date(participant.banned_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일</p>
                  {participant?.ban_reason && <p className="text-xs text-red-500 mt-1">사유: {participant.ban_reason}</p>}
                </div>
                <button onClick={async () => {
                  await fetch(`/api/participants?id=${memberId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ banned_until: null, ban_reason: null })
                  })
                  alert('밴 해제 완료!')
                }} className="text-xs bg-red-600 text-white rounded px-2 py-1">밴 해제</button>
              </div>
            </div>
          )}
          {participant?.cover_penalty_until && new Date(participant.cover_penalty_until) > new Date() && (
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-orange-600">🎵 커버 페널티 중</p>
                  <p className="text-xs text-gray-500 mt-1">해제일: {new Date(participant.cover_penalty_until).toLocaleDateString('ko-KR')}</p>
                  <p className="text-xs text-gray-500">남은 기간: {Math.ceil((new Date(participant.cover_penalty_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일</p>
                </div>
                <button onClick={async () => {
                  await fetch(`/api/participants?id=${memberId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cover_penalty_until: null })
                  })
                  alert('커버 페널티 해제 완료!')
                }} className="text-xs bg-orange-600 text-white rounded px-2 py-1">페널티 해제</button>
              </div>
            </div>
          )}
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
  const [participantSearch, setParticipantSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [memberDetailTab, setMemberDetailTab] = useState<'activity' | 'info'>('activity')
  const [clientDetailTab, setClientDetailTab] = useState<'projects' | 'info'>('projects')
  const PAGE_SIZE = 10

  const router = useRouter()

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
    if (!name || !email || !mobile) { alert('이름, 이메일, 휴대전화는 필수입니다.'); return }
    
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
      alert('계정 생성 실패! ' + errorMsg)
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
    if (!res.ok) { alert('등록 실패!'); return }

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

    alert(`등록 완료! 임시 비밀번호(${tempPassword})가 ${mobile}로 전송됐어요.`)
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
    if (!res.ok) { alert('수정 실패!'); return }
    alert('수정 완료!')
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
    if (!res.ok) { alert('삭제 실패!'); return }
    alert('삭제 완료!')
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
    if (!newClientName || !newClientEmail || !newClientMobile) { alert('이름, 이메일, 휴대전화는 필수입니다.'); return }
    
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
      alert('계정 생성 실패! ' + errorMsg)
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
    if (!res.ok) { alert('등록 실패!'); return }

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

    alert(`등록 완료! 의뢰인 코드: ${clientId}\n임시 비밀번호(${tempPassword})가 ${newClientMobile}로 전송됐어요.`)
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
    if (!res.ok) { alert('수정 실패!'); return }
    if (cProjectCode && selectedClient.client_id) {
      await fetch(`/api/projects?project_code=${cProjectCode.toUpperCase()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClient.client_id })
      })
    }
    alert('수정 완료!')
    fetchClients()
  }

  const handleDeleteClient = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/users?id=${selectedClient.id}`, { method: 'DELETE' })
    if (!res.ok) { alert('삭제 실패!'); return }
    alert('삭제 완료!')
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
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">회원 관리</h1>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
            <button onClick={() => router.push('/client')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/settlement')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
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
                        <div key={p.id} onClick={() => selected?.id === p.id ? clearForm() : handleSelect(p)} className={`border rounded-lg p-3 cursor-pointer ${selected?.id === p.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{p.name}</p>
                                <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Lv.{p.level ?? 1}</span>
                                {p.is_cover_possible && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">🎵 커버가능</span>
                                )}
                                {p.cover_approved && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded">✅ 승인</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{p.email}</p>
                            </div>
                            <p className="text-sm font-medium text-blue-600">{p.balance?.toLocaleString() ?? 0}P</p>
                          </div>
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
                  <div className="flex gap-2">
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
                    {selected?.is_cover_possible && (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-purple-700 mb-2">🎵 커버영상 신청</p>
                        {selected.cover_video_url && (
                          <a href={selected.cover_video_url} target="_blank" className="text-xs text-blue-500 block mb-2">영상 링크 보기 →</a>
                        )}
                        <div className="flex gap-2">
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
                            alert('커버영상 승인 완료!')
                            fetchParticipants()
                          }} className="flex-1 bg-purple-600 text-white rounded-lg py-2 text-xs font-medium">승인</button>
                          <button onClick={async () => {
                            await fetch(`/api/participants?id=${selected.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ cover_approved: false })
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
                            alert('승인 취소 완료!')
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
                              <p className="text-xs">{req.old_id} → <span className="font-bold text-blue-600">{req.new_id}</span></p>
                              <div className="flex gap-2 mt-2">
                                {req.status === 'PENDING' ? (
                                  <>
                                    <button onClick={async () => {
                                      await fetch(`/api/sns_change_requests?id=${req.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'APPROVED' })
                                      })
                                      setSnsRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'APPROVED'} : r))
                                      setSelected((prev: any) => ({...prev, [`${req.platform}_id`]: req.new_id}))
                                      alert('승인됐어요!')
                                    }} className="flex-1 bg-blue-600 text-white rounded-lg py-1 text-xs">승인</button>
                                    <button onClick={async () => {
                                      await fetch(`/api/sns_change_requests?id=${req.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'REJECTED' })
                                      })
                                      setSnsRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'REJECTED'} : r))
                                      alert('거절됐어요.')
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
                    <div className="flex gap-2">
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
                  <ActivityDetail memberId={selected.id} />
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

                <div className="flex justify-between text-sm font-bold bg-gray-100 rounded p-2">
                  <span>총 수익</span>
                  <span className="text-blue-600">
                    {(memberPosts.length * (level === 50 ? 10000 : 2500 + (level - 1) * 150) + memberCommentMissions.length * 300 + (selected?.cover_reward ? Number(selected.cover_reward) : 0)).toLocaleString()}P
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
                      <div className="flex gap-2">
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
                  <div className="flex gap-2">
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
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
        </div>
      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50"
      >
        ↑
      </button>
      {/* 하단 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">        
        <button onClick={() => router.push('/client')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">🏢</span>의뢰인
        </button>
        <button onClick={() => router.push('/members')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">👤</span>회원관리
        </button>
        <button onClick={() => router.push('/settlement')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">💰</span>정산
        </button>
        <button onClick={() => router.push('/cover')} className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400">
          <span className="text-lg mb-0.5">🎵</span>커버
        </button>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  )
}