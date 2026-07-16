'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { decryptText, encryptText } from '../lib/crypto'

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
  }

  const clearForm = () => {
    setSelected(null)
    setName(''); setMobile(''); setEmail(''); setBankName('')
    setAccountHolder(''); setAccountNumber(''); setInstagram('')
    setYoutube(''); setTiktok(''); setPassword(''); setLevel(1)
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
    if (authError) { alert('계정 생성 실패! ' + authError.message); return }

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
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/participants?id=${selected.id}`, { method: 'DELETE' })
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
  }

  const clearClientForm = () => {
    setSelectedClient(null)
    setCName(''); setCCompany(''); setCArtist(''); setCPhone('')
    setCMobile(''); setCEmail(''); setCPassword(''); setCProjectCode('')
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
    if (authError) { alert('계정 생성 실패! ' + authError.message); return }

    // DB에 의뢰인 정보 저장
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClientName, company: newClientCompany, artist: newClientArtist,
        phone: newClientPhone, mobile: newClientMobile, email: newClientEmail,
        password: '', role: 'client', client_id: clientId
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
    return true
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
            <div className="text-center py-1 text-sm text-blue-500">
              {isRefreshing ? '🔄 새로고침 중...' : '↓ 놓으면 새로고침'}
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">회원 관리</h1>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/admin')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
            <button onClick={() => router.push('/participant')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
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
                  <h2 className="font-bold">체험단 목록</h2>
                  <div className="flex gap-1">
                    <button onClick={() => setCoverFilter('all')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : ''}`}>전체</button>
                    <button onClick={() => setCoverFilter('cover')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'cover' ? 'bg-purple-600 text-white border-purple-600' : ''}`}>커버가능</button>
                    <button onClick={() => setCoverFilter('normal')} className={`text-xs px-2 py-1 rounded border ${coverFilter === 'normal' ? 'bg-gray-600 text-white border-gray-600' : ''}`}>일반회원</button>
                  </div>
                </div>
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
                        <span className="text-xs text-gray-500">{participantPage + 1} / {Math.ceil(filteredParticipants.length / PAGE_SIZE)}</span>
                        <button onClick={() => setParticipantPage(p => Math.min(Math.ceil(filteredParticipants.length / PAGE_SIZE) - 1, p + 1))} disabled={(participantPage + 1) * PAGE_SIZE >= filteredParticipants.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'client' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">의뢰인 목록</h2>
                {clients.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">의뢰인이 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {clients.slice(clientPage * PAGE_SIZE, (clientPage + 1) * PAGE_SIZE).map((c) => (
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
                    {clients.length > PAGE_SIZE && (
                      <div className="flex justify-between items-center mt-3">
                        <button onClick={() => setClientPage(p => Math.max(0, p - 1))} disabled={clientPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
                        <span className="text-xs text-gray-500">{clientPage + 1} / {Math.ceil(clients.length / PAGE_SIZE)}</span>
                        <button onClick={() => setClientPage(p => Math.min(Math.ceil(clients.length / PAGE_SIZE) - 1, p + 1))} disabled={(clientPage + 1) * PAGE_SIZE >= clients.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
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
                {(selected || showParticipantInsert) && (
                  <div className="space-y-3">
                    {[
                      { label: '이름', value: name, setter: setName },
                      { label: '휴대전화', value: mobile, setter: setMobile },
                      { label: '이메일', value: email, setter: setEmail, type: 'email' },
                      { label: '인스타그램 ID', value: instagram, setter: setInstagram },
                      { label: '유튜브 ID', value: youtube, setter: setYoutube },
                      { label: '틱톡 ID', value: tiktok, setter: setTiktok },
                    ].map(({ label, value, setter, type }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
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
                      { label: '아티스트명', value: newClientArtist, setter: setNewClientArtist },
                      { label: '전화번호', value: newClientPhone, setter: setNewClientPhone },
                      { label: '휴대전화 *', value: newClientMobile, setter: setNewClientMobile },
                      { label: '이메일 *', value: newClientEmail, setter: setNewClientEmail, type: 'email' },
                    ].map(({ label, value, setter, type }) => (
                      <div key={label}>
                        <label className="text-sm font-medium">{label}</label>
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
                <div className="space-y-3">
                  {[
                    { label: '대표자명', value: cName, setter: setCName },
                    { label: '소속사명', value: cCompany, setter: setCCompany },
                    { label: '아티스트명', value: cArtist, setter: setCArtist },
                    { label: '전화번호', value: cPhone, setter: setCPhone },
                    { label: '휴대전화', value: cMobile, setter: setCMobile },
                    { label: '이메일', value: cEmail, setter: setCEmail, type: 'email' },
                  ].map(({ label, value, setter, type }) => (
                    <div key={label}>
                      <label className="text-sm font-medium">{label}</label>
                      <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium">프로젝트 코드 연결</label>
                    <input value={cProjectCode} onChange={(e) => setCProjectCode(e.target.value.toUpperCase())} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: A_1" />
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
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mb-2">
          <button onClick={handleLogout} className="w-full text-sm text-gray-400 border border-gray-200 rounded-lg py-2">로그아웃</button>
        </div>
      </div>
    </div>
  )
}