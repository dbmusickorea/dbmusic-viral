'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

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

  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchParticipants()
    fetchClients()
  }, [])

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false })
    setParticipants(data ?? [])
  }

  const fetchClients = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'client').order('name', { ascending: true })
    setClients(data ?? [])
  }

  const handleSelect = (p: any) => {
    setSelected(p)
    setName(p.name ?? ''); setMobile(p.mobile ?? ''); setEmail(p.email ?? '')
    setBankName(p.bank_name ?? ''); setAccountHolder(p.account_holder ?? '')
    setAccountNumber(p.account_number ?? ''); setInstagram(p.instagram_id ?? '')
    setYoutube(p.youtube_id ?? ''); setTiktok(p.tiktok_id ?? '')
    setPassword(''); setLevel(p.level ?? 1)
  }

  const clearForm = () => {
    setSelected(null)
    setName(''); setMobile(''); setEmail(''); setBankName('')
    setAccountHolder(''); setAccountNumber(''); setInstagram('')
    setYoutube(''); setTiktok(''); setPassword(''); setLevel(1)
  }

  const handleInsert = async () => {
    const { error } = await supabase.from('participants').insert({
      name, mobile, email, bank_name: bankName,
      account_holder: accountHolder, account_number: accountNumber,
      instagram_id: instagram, youtube_id: youtube,
      tiktok_id: tiktok, password, level
    })
    if (error) { alert('등록 실패!'); return }
    alert('등록 완료!')
    fetchParticipants()
    clearForm()
  }

  const handleUpdate = async () => {
    const updateData: any = {
      name, mobile, email, bank_name: bankName,
      account_holder: accountHolder, account_number: accountNumber,
      instagram_id: instagram, youtube_id: youtube,
      tiktok_id: tiktok, level
    }
    if (password) updateData.password = password
    const { error } = await supabase.from('participants').update(updateData).eq('id', selected.id)
    if (error) { alert('수정 실패!'); return }
    alert('수정 완료!')
    fetchParticipants()
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('participants').delete().eq('id', selected.id)
    if (error) { alert('삭제 실패!'); return }
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

  const handleUpdateClient = async () => {
    const updateData: any = {
      name: cName, company: cCompany, artist: cArtist,
      phone: cPhone, mobile: cMobile, email: cEmail,
      project_code: cProjectCode || null
    }
    if (cPassword) updateData.password = cPassword
    const { error } = await supabase.from('users').update(updateData).eq('id', selectedClient.id)
    if (error) { alert('수정 실패!'); return }
    if (cProjectCode && selectedClient.client_id) {
      await supabase.from('projects').update({ client_id: selectedClient.client_id }).eq('project_code', cProjectCode.toUpperCase())
    }
    alert('수정 완료!')
    fetchClients()
  }

  const handleDeleteClient = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const { error } = await supabase.from('users').delete().eq('id', selectedClient.id)
    if (error) { alert('삭제 실패!'); return }
    alert('삭제 완료!')
    fetchClients()
    clearClientForm()
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">👥 회원 관리</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
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
                <h2 className="font-bold mb-3">체험단 목록</h2>
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">회원이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} onClick={() => selected?.id === p.id ? clearForm() : handleSelect(p)} className={`border rounded-lg p-3 cursor-pointer ${selected?.id === p.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{p.name}</p>
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Lv.{p.level ?? 1}</span>
                            </div>
                            <p className="text-xs text-gray-500">{p.email}</p>
                          </div>
                          <p className="text-sm font-medium text-blue-600">{p.balance?.toLocaleString() ?? 0}원</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'client' && (
              <div className="bg-white rounded-2xl shadow p-4 mb-4">
                <h2 className="font-bold mb-3">의뢰인 목록</h2>
                {clients.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">의뢰인이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {clients.map((c) => (
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
                )}
              </div>
            )}
          </div>

          {/* 오른쪽 - 등록/수정 */}
          <div>
            {tab === 'participant' && (
              <div className="bg-white rounded-2xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold">{selected ? '체험단 수정' : '체험단 등록'}</h2>
                  <div className="flex gap-2">
                    {selected && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '이름', value: name, setter: setName },
                    { label: '휴대전화', value: mobile, setter: setMobile },
                    { label: '이메일', value: email, setter: setEmail, type: 'email' },
                    { label: '은행명', value: bankName, setter: setBankName },
                    { label: '예금주', value: accountHolder, setter: setAccountHolder },
                    { label: '계좌번호', value: accountNumber, setter: setAccountNumber },
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
                        <option key={lv} value={lv}>Lv.{lv} ({lv === 50 ? '10,000원' : `${(2500 + (lv-1) * 150).toLocaleString()}원`})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{selected ? '새 비밀번호 (변경시만)' : '비밀번호'}</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  </div>
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
                  <div>
                    <label className="text-sm font-medium">새 비밀번호 (변경시만)</label>
                    <input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
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
      </div>
    </div>
  )
}