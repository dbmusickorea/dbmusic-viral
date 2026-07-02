'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Page1() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [clientName, setClientName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [productContent, setProductContent] = useState('')
  const [requirements, setRequirements] = useState('')
  const [status, setStatus] = useState('ONGOING')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rewardPerPost, setRewardPerPost] = useState('')
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data ?? [])
  }

  const handleSelectProject = (project: any) => {
    setSelectedProject(project)
    setClientName(project.client_name ?? '')
    setProjectCode(project.project_code ?? '')
    setProductContent(project.product_content ?? '')
    setRequirements(project.requirements ?? '')
    setStatus(project.status ?? 'ONGOING')
    setStartDate(project.start_date ? project.start_date.substring(0, 10) : '')
    setEndDate(project.end_date ? project.end_date.substring(0, 10) : '')
    setRewardPerPost(project.reward_per_post ?? '')
  }

  const handleInsert = async () => {
    const { error } = await supabase.from('projects').insert({
      project_code: projectCode.toUpperCase(),
      client_name: clientName,
      product_content: productContent,
      requirements,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      reward_per_post: Number(rewardPerPost)
    })
    if (error) { alert('등록 실패!'); return }
    alert('등록 완료!')
    fetchProjects()
    clearForm()
  }

  const handleUpdate = async () => {
    const { error } = await supabase.from('projects').update({
      client_name: clientName,
      product_content: productContent,
      requirements,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      reward_per_post: Number(rewardPerPost)
    }).eq('project_code', projectCode)
    if (error) { alert('수정 실패!'); return }
    alert('수정 완료!')
    fetchProjects()
  }

  const clearForm = () => {
    setSelectedProject(null)
    setClientName('')
    setProjectCode('')
    setProductContent('')
    setRequirements('')
    setStatus('ONGOING')
    setStartDate('')
    setEndDate('')
    setRewardPerPost('')
  }

  const handleLogout = () => {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-base mt-1 box-border"
  const dateInputStyle = { maxWidth: '100%', boxSizing: 'border-box' as const }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">🎵 프로젝트 관리</h1>
            <button onClick={handleLogout} className="text-xs text-gray-500 border rounded px-2 py-1">로그아웃</button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => router.push('/page2')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/page3')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/page4')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
            <button onClick={() => router.push('/page5')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold mb-3">프로젝트 목록</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} onClick={() => handleSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{project.project_code}</p>
                      <p className="text-xs text-gray-500">{project.client_name} · {project.product_content}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{selectedProject ? '프로젝트 수정' : '프로젝트 등록'}</h2>
            {selectedProject && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">프로젝트 코드</label>
              <input value={projectCode} onChange={(e) => setProjectCode(e.target.value)} disabled={!!selectedProject} className={`${inputClass} disabled:bg-gray-100`} placeholder="예: A_1" />
            </div>
            <div>
              <label className="text-sm font-medium">의뢰인명</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium">상품내용</label>
              <input value={productContent} onChange={(e) => setProductContent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium">요청사항</label>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} className={inputClass} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">프로젝트 상태</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="ONGOING">진행중</option>
                <option value="PAUSED">대기중</option>
                <option value="COMPLETED">완료</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} style={dateInputStyle} />
            </div>
            <div>
              <label className="text-sm font-medium">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} style={dateInputStyle} />
            </div>
            <div>
              <label className="text-sm font-medium">게시물당 금액</label>
              <input type="number" value={rewardPerPost} onChange={(e) => setRewardPerPost(e.target.value)} className={inputClass} />
            </div>
            <div>
              {selectedProject ? (
                <button onClick={handleUpdate} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">정보 수정하기</button>
              ) : (
                <button onClick={handleInsert} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">의뢰인 등록</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}