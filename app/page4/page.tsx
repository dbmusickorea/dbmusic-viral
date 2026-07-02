'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page4() {
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
  const [facebook, setFacebook] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false })
    setParticipants(data ?? [])
  }

  const handleSelect = (p: any) => {
    setSelected(p)
    setName(p.name ?? ''); setMobile(p.mobile ?? ''); setEmail(p.email ?? '')
    setBankName(p.bank_name ?? ''); setAccountHolder(p.account_holder ?? '')
    setAccountNumber(p.account_number ?? ''); setInstagram(p.instagram_id ?? '')
    setYoutube(p.youtube_id ?? ''); setTiktok(p.tiktok_id ?? '')
    setFacebook(p.facebook_id ?? ''); setPassword('')
  }

  const clearForm = () => {
    setSelected(null)
    setName(''); setMobile(''); setEmail(''); setBankName('')
    setAccountHolder(''); setAccountNumber(''); setInstagram('')
    setYoutube(''); setTiktok(''); setFacebook(''); setPassword('')
  }

  const handleInsert = async () => {
    const { error } = await supabase.from('participants').insert({
      name, mobile, email, bank_name: bankName,
      account_holder: accountHolder, account_number: accountNumber,
      instagram_id: instagram, youtube_id: youtube,
      tiktok_id: tiktok, facebook_id: facebook, password
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
      tiktok_id: tiktok, facebook_id: facebook
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

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">👥 체험단 회원 관리</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/page1')} className="flex-1 text-xs border rounded py-2 text-center">프로젝트</button>
            <button onClick={() => router.push('/page2')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/page3')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/page5')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">체험단 목록</h2>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">회원이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} onClick={() => handleSelect(p)} className={`border rounded-lg p-3 cursor-pointer ${selected?.id === p.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </div>
                    <p className="text-sm font-medium text-blue-600">{p.balance?.toLocaleString() ?? 0}원</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{selected ? '회원 수정' : '체험단 등록'}</h2>
            {selected && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
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
              { label: '페이스북 ID', value: facebook, setter: setFacebook },
            ].map(({ label, value, setter, type }) => (
              <div key={label}>
                <label className="text-sm font-medium">{label}</label>
                <input type={type ?? 'text'} value={value} onChange={(e) => setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
            ))}
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
      </div>
    </div>
  )
}