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
  const [optionName, setOptionName] = useState('')
  const [optionPrice, setOptionPrice] = useState('')
  const [isUpdatingLikes, setIsUpdatingLikes] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [updatingPostId, setUpdatingPostId] = useState<number | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
  const [showProductManager, setShowProductManager] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') { router.push('/'); return }
    fetchProjects()
    fetchProducts()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data ?? [])
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true })
    setProducts(data ?? [])
  }

  const handleAddProduct = async () => {
    if (!newProduct) { alert('상품명을 입력해주세요.'); return }
    const { error } = await supabase.from('products').insert({ name: newProduct, price: Number(newProductPrice) || 0 })
    if (error) { alert('등록 실패!'); return }
    setNewProduct('')
    setNewProductPrice('')
    fetchProducts()
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const fetchPosts = async (code: string) => {
    const { data } = await supabase.from('posts').select('*').eq('project_code', code).order('created_at', { ascending: false })
    setPosts(data ?? [])
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
    setOptionName(project.option_name ?? '')
    setOptionPrice(project.option_price ?? '')
    fetchPosts(project.project_code)
  }

  const getSelectedProductPrice = () => {
    const product = products.find(p => p.name === productContent)
    return product?.price ?? 0
  }

  const getTotalCost = () => {
    const productPrice = getSelectedProductPrice()
    const option = Number(optionPrice) || 0
    return productPrice + option
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
      reward_per_post: Number(rewardPerPost),
      option_name: optionName || null,
      option_price: Number(optionPrice) || null
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
      reward_per_post: Number(rewardPerPost),
      option_name: optionName || null,
      option_price: Number(optionPrice) || null
    }).eq('project_code', projectCode)
    if (error) { alert('수정 실패!'); return }
    alert('수정 완료!')
    fetchProjects()
  }

  const handleUpdateAllLikes = async () => {
    setIsUpdatingLikes(true)
    const { data: allPosts } = await supabase.from('posts').select('*')
    if (!allPosts) { setIsUpdatingLikes(false); return }

    for (const post of allPosts) {
      if (post.platform !== 'instagram') continue
      try {
        const shortcode = post.post_url.split('/p/')[1]?.split('/')[0]
        if (!shortcode) continue
        const response = await fetch(`/api/instagram?shortcode=${shortcode}`)
        const data = await response.json()
        await supabase.from('posts').update({
          likes_count: data.like_count ?? post.likes_count,
          comments_count: data.comment_count ?? post.comments_count
        }).eq('id', post.id)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch { continue }
    }

    setIsUpdatingLikes(false)
    alert('좋아요 수 갱신 완료!')
    if (selectedProject) fetchPosts(selectedProject.project_code)
  }

  const handleUpdateSingleLike = async (post: any) => {
    if (post.platform !== 'instagram') { alert('인스타그램 게시물만 갱신 가능해요!'); return }
    setUpdatingPostId(post.id)
    try {
      const shortcode = post.post_url.split('/p/')[1]?.split('/')[0]
      if (!shortcode) { setUpdatingPostId(null); return }
      const response = await fetch(`/api/instagram?shortcode=${shortcode}`)
      const data = await response.json()
      await supabase.from('posts').update({
        likes_count: data.like_count ?? post.likes_count,
        comments_count: data.comment_count ?? post.comments_count
      }).eq('id', post.id)
      fetchPosts(selectedProject.project_code)
      alert('갱신 완료!')
    } catch {
      alert('갱신 실패!')
    }
    setUpdatingPostId(null)
  }

  const clearForm = () => {
    setSelectedProject(null)
    setClientName(''); setProjectCode(''); setProductContent('')
    setRequirements(''); setStatus('ONGOING'); setStartDate('')
    setEndDate(''); setRewardPerPost(''); setOptionName(''); setOptionPrice('')
    setPosts([])
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
          <div className="flex gap-1 mb-2">
            <button onClick={() => router.push('/page2')} className="flex-1 text-xs border rounded py-2 text-center">체험단</button>
            <button onClick={() => router.push('/page3')} className="flex-1 text-xs border rounded py-2 text-center">의뢰인</button>
            <button onClick={() => router.push('/page4')} className="flex-1 text-xs border rounded py-2 text-center">회원관리</button>
            <button onClick={() => router.push('/page5')} className="flex-1 text-xs border rounded py-2 text-center">정산</button>
          </div>
          <button
            onClick={handleUpdateAllLikes}
            disabled={isUpdatingLikes}
            className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium disabled:bg-gray-400"
          >
            {isUpdatingLikes ? '갱신 중...' : '🔄 전체 좋아요 수 갱신'}
          </button>
        </div>

        {/* 상품 사전 등록 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📦 상품 사전 등록</h2>
            <button onClick={() => setShowProductManager(!showProductManager)} className="text-xs border rounded px-2 py-1">
              {showProductManager ? '닫기' : '관리'}
            </button>
          </div>
          {showProductManager && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={newProduct} onChange={(e) => setNewProduct(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="상품명" />
                <input type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} className="w-28 border rounded-lg px-3 py-2 text-sm" placeholder="가격" />
                <button onClick={handleAddProduct} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
              </div>
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">등록된 상품이 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {products.map((p) => (
                    <div key={p.id} className="flex justify-between items-center border rounded-lg px-3 py-2">
                      <p className="text-sm">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-blue-600">{p.price?.toLocaleString()}원</p>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500">삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 프로젝트 목록 */}
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
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {project.status === 'ONGOING' ? '진행중' : project.status === 'PAUSED' ? '대기중' : '완료'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 등록/수정 폼 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">{selectedProject ? '프로젝트 수정' : '프로젝트 등록'}</h2>
            {selectedProject && <button onClick={clearForm} className="text-xs text-gray-500 border rounded px-2 py-1">새 등록</button>}
          </div>

          {/* 총비용 표시 */}
          {(productContent && productContent !== '__direct__') && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500">💰 프로젝트 총비용</p>
              <p className="text-xl font-bold text-blue-600">{getTotalCost().toLocaleString()}원</p>
              <div className="text-xs text-gray-500 mt-1">
                <p>상품: {getSelectedProductPrice().toLocaleString()}원</p>
                {optionPrice && <p>옵션: +{Number(optionPrice).toLocaleString()}원</p>}
              </div>
            </div>
          )}

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
              {products.length > 0 ? (
                <select value={productContent} onChange={(e) => setProductContent(e.target.value)} className={inputClass}>
                  <option value="">상품 선택</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>{p.name} ({p.price?.toLocaleString()}원)</option>
                  ))}
                  <option value="__direct__">직접 입력</option>
                </select>
              ) : (
                <input value={productContent} onChange={(e) => setProductContent(e.target.value)} className={inputClass} placeholder="상품내용 입력" />
              )}
              {productContent === '__direct__' && (
                <input value="" onChange={(e) => setProductContent(e.target.value)} className={`${inputClass} mt-2`} placeholder="직접 입력" autoFocus />
              )}
            </div>

            {/* 추가 옵션 */}
            <div>
              <label className="text-sm font-medium">추가 옵션명 (선택)</label>
              <input value={optionName} onChange={(e) => setOptionName(e.target.value)} className={inputClass} placeholder="예: 숏츠 3개 추가" />
            </div>
            <div>
              <label className="text-sm font-medium">추가 옵션 가격 (선택)</label>
              <input type="number" value={optionPrice} onChange={(e) => setOptionPrice(e.target.value)} className={inputClass} placeholder="옵션 가격 입력" />
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
              <label className="text-sm font-medium">게시물당 금액 (체험단 지급)</label>
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

        {/* 게시물 목록 */}
        {selectedProject && (
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-bold mb-3">📋 게시물 목록 ({posts.length}개)</h2>
            {posts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">게시물이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{post.influencer_name}</p>
                        <p className="text-xs text-gray-500">{post.platform} · {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                        <a href={post.post_url} target="_blank" className="text-xs text-blue-500 block overflow-hidden text-ellipsis whitespace-nowrap">링크 보기 →</a>
                        <p className="text-xs mt-1">❤️ {post.likes_count?.toLocaleString()} · 💬 {post.comments_count?.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleUpdateSingleLike(post)}
                        disabled={updatingPostId === post.id}
                        className="text-xs bg-orange-500 text-white rounded px-2 py-1 disabled:bg-gray-400 shrink-0"
                      >
                        {updatingPostId === post.id ? '...' : '갱신'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}