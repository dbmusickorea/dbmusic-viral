'use client'
import { fetchWithAuth } from '../app/lib/fetchWithAuth'

type Props = {
  formData: any
  setFormData: (fn: any) => void
  products: any[]
  clients: any[]
  artistList: any[]
  coverImageFile: File | null
  setCoverImageFile: (f: File | null) => void
  isSaving: boolean
  selectedProject: any
  handleInsert: () => void
  handleUpdate: () => void
  handlePrefixChange: (v: string) => void
  getTotalCost: () => number
  getSelectedProductPrice: () => number
  showToast: (msg: string) => void
  clientSearch: string
  setClientSearch: (v: string) => void
  setArtistList: (v: any[]) => void
  filteredClients: any[]
}

const inputClass = 'w-full border rounded-lg px-3 py-2 text-base box-border dark:bg-gray-700 dark:text-white dark:border-gray-600'
const dateInputStyle = { WebkitAppearance: 'none' as const }

export default function AdminProjectForm({ formData, setFormData, products, clients, artistList, coverImageFile, setCoverImageFile, isSaving, selectedProject, handleInsert, handleUpdate, handlePrefixChange, getTotalCost, getSelectedProductPrice, showToast, clientSearch, setClientSearch, setArtistList, filteredClients }: Props) {
  return (
    <>
                  {(formData.productContent && formData.productContent !== '__direct__') && (
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">💰 프로젝트 총비용</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{getTotalCost().toLocaleString()}원</p>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p>상품: {getSelectedProductPrice().toLocaleString()}원</p>
                        {formData.optionPrice && <p>추가 옵션: +{Number(formData.optionPrice).toLocaleString()}원</p>}
                        {Number(formData.requiredPosts) === 2 && <p>게시물 2개 (+50%): +{Math.floor(getSelectedProductPrice() * 0.5).toLocaleString()}원</p>}
                        {formData.monitoringExtension > 0 && <p>모니터링 연장 ({formData.monitoringExtension}일): +{(formData.monitoringExtension === 15 ? 200000 : formData.monitoringExtension === 30 ? 400000 : 600000).toLocaleString()}원</p>}
                        {formData.refreshInterval && formData.refreshInterval !== '' && formData.refreshInterval !== '0' && formData.refreshInterval !== '12' && <p>트래픽 부스터: +{(formData.refreshInterval === '6' ? 150000 : formData.refreshInterval === '3' ? 300000 : 800000).toLocaleString()}원</p>}
                        {formData.coverVideoCount > 0 && <p>커버영상 ({formData.coverVideoCount}개): +{(formData.coverVideoCount === 10 ? 1500000 : formData.coverVideoCount === 20 ? 3000000 : 4500000).toLocaleString()}원</p>}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {!selectedProject ? (
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">프로젝트 코드 자동생성</label>
                        <div className="flex gap-2 mt-1">
                          <input value={formData.projectPrefix} onChange={(e) => handlePrefixChange(e.target.value)} className="w-20 border rounded-lg px-3 py-2 text-base dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="A" maxLength={3} />
                          <div className="flex-1 border rounded-lg px-3 py-2 text-base bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">{formData.projectCode || '코드 자동생성'}</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">알파벳 입력 시 자동으로 코드가 생성돼요</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">프로젝트 코드</label>
                        <input value={formData.projectCode} className={`${inputClass} bg-gray-100`} disabled />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">앨범 자켓 이미지</label>
                      <input type="file" accept="image/*" onChange={(e) => setCoverImageFile(e.target.files?.[0] ?? null)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600" />
                      {coverImageFile && (
                        <img src={URL.createObjectURL(coverImageFile)} className="w-20 h-20 rounded-lg object-cover mt-2" />
                      )}
                      {!coverImageFile && formData.coverImageUrl && (
                        <img src={formData.coverImageUrl} className="w-20 h-20 rounded-lg object-cover mt-2" />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">의뢰인 선택</label>
                      <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className={inputClass} placeholder="이름/소속사/아티스트 검색" />
                      {clientSearch && filteredClients.length > 0 && (
                        <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                          {filteredClients.map((c: any) => (
                            <div key={c.id} onClick={async () => { 
                              setFormData((prev: any) => ({...prev, selectedClientId: c.client_id, clientName: c.name, artistName: c.artist ?? ''}))
                              setClientSearch(`${c.name} - ${c.company ?? ''} ${c.artist ? `(${c.artist})` : ''} [${c.client_id}]`)
                              // 아티스트 목록 불러오기
                              const res = await fetchWithAuth(`/api/artists?client_id=${c.client_id}`)
                              const data = await res.json()
                              setArtistList(data ?? [])
                            }} className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${formData.selectedClientId === c.client_id ? 'bg-blue-50' : ''}`}>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.company} {c.artist ? `· ${c.artist}` : ''} [{c.client_id}]</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {formData.selectedClientId && <p className="text-xs text-green-600 mt-1">✅ 선택된 의뢰인 코드: {formData.selectedClientId}</p>}
                    </div>
                    {formData.selectedClientId && artistList.length > 0 && (
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">아티스트 선택</label>
                        <select value={formData.artistName} onChange={(e) => setFormData((prev: any) => ({...prev, artistName: e.target.value}))} className={inputClass}>
                          <option value="">아티스트 선택</option>
                          {artistList.map((a) => (
                            <option key={a.id} value={a.artist_name}>{a.artist_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">노래제목</label>
                      <input value={formData.songTitle} onChange={(e) => setFormData((prev: any) => ({...prev, songTitle: e.target.value}))} className={inputClass} placeholder="노래제목 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">메타 캠페인 ID</label>
                      <input value={formData.metaCampaignId ?? ''} onChange={(e) => setFormData((prev: any) => ({...prev, metaCampaignId: e.target.value}))} className={inputClass} placeholder="메타 광고 캠페인 ID 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">인스타그램 음원 URL</label>
                      <input value={formData.instagramAudioId} onChange={(e) => {
                        const match = e.target.value.match(/reels\/audio\/(\d+)/)
                        setFormData((prev: any) => ({...prev, instagramAudioId: match ? match[1] : e.target.value}))
                      }} className={inputClass} placeholder="https://www.instagram.com/reels/audio/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">틱톡 음원 URL</label>
                      <input value={formData.tiktokAudioId} onChange={(e) => {
                        setFormData((prev: any) => ({...prev, tiktokAudioId: e.target.value}))
                      }} className={inputClass} placeholder="https://www.tiktok.com/music/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">유튜브 음원 URL</label>
                      <input value={formData.youtubeAudioId} onChange={(e) => {
                        const watchMatch = e.target.value.match(/[?&]v=([^&]+)/)
                        const sourceMatch = e.target.value.match(/source\/([^/]+)\/shorts/)
                        setFormData((prev: any) => ({...prev, youtubeAudioId: watchMatch ? watchMatch[1] : sourceMatch ? sourceMatch[1] : e.target.value}))
                      }} className={inputClass} placeholder="https://youtube.com/source/ID/shorts 또는 watch?v=..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">상품내용</label>
                      {products.length > 0 ? (
                        <select value={formData.productContent} onChange={(e) => {
                          setFormData((prev: any) => ({...prev, productContent: e.target.value,
                            refreshInterval: (e.target.value.includes('스탠다드') || e.target.value.includes('디럭스')) ? '12' :
                              (e.target.value.includes('프리미엄') || e.target.value.includes('메가')) ? '6' : prev.refreshInterval,
                            requiredPosts: (e.target.value.includes('스탠다드 30') || e.target.value.includes('스탠다드30')) ? '1' : prev.requiredPosts,
                          }))
                        }} className={inputClass}>
                          <option value="">상품 선택</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>{p.name} ({p.price?.toLocaleString()}P)</option>
                          ))}
                          <option value="__direct__">직접 입력</option>
                        </select>
                      ) : (
                        <input value={formData.productContent} onChange={(e) => setFormData((prev: any) => ({...prev, productContent: e.target.value}))} className={inputClass} placeholder="상품내용 입력" />
                      )}
                      {formData.productContent === '__direct__' && (
                        <input value="" onChange={(e) => setFormData((prev: any) => ({...prev, productContent: e.target.value}))} className={`${inputClass} mt-2`} placeholder="직접 입력" autoFocus />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">추가 옵션명 (선택)</label>
                      <input value={formData.optionName} onChange={(e) => setFormData((prev: any) => ({...prev, optionName: e.target.value}))} className={inputClass} placeholder="예: 숏츠 3개 추가" />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">추가 옵션 가격 (선택)</label>
                      <input type="number" value={formData.optionPrice} onChange={(e) => setFormData((prev: any) => ({...prev, optionPrice: e.target.value}))} className={inputClass} placeholder="옵션 가격 입력" />
                    </div>
                    <div>
                      {/* 유튜브 링크 */}
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium dark:text-gray-200">댓글 부스팅 유튜브 링크</label>
                        <button onClick={() => setFormData((prev: any) => ({...prev, projectLinks: [...prev.projectLinks, { platform: 'youtube_shorts', url: '', isNew: true }]}))} className="text-xs bg-red-600 text-white px-2 py-1 rounded">+ 추가</button>
                      </div>
                      {formData.projectLinks.filter((l: any) => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(l.platform)).map((link: any, i: any) => {
                        const realIdx = formData.projectLinks.indexOf(link)
                        return (
                          <div key={i} className="flex gap-2 mt-2 items-center">
                            <select value={link.platform} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].platform = e.target.value
                              setFormData((prev: any) => ({...prev, projectLinks: newLinks}))
                            }} className="border rounded-lg px-2 py-2 text-base box-border dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <option value="youtube_shorts">유튜브 숏츠</option>
                              <option value="youtube_long">유튜브 영상</option>
                              <option value="youtube_lyric">리릭영상</option>
                              <option value="playlist">플레이리스트</option>
                            </select>
                            <input value={link.url} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].url = e.target.value
                              setFormData((prev: any) => ({...prev, projectLinks: newLinks}))
                            }} className="flex-1 border rounded-lg px-3 py-2 text-base box-border dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="URL 입력" />
                            <button onClick={async () => {
                              if (!link.isNew && link.id) await fetchWithAuth(`/api/project_links?id=${link.id}`, { method: 'DELETE' })
                              setFormData((prev: any) => ({...prev, projectLinks: formData.projectLinks.filter((_: any, idx: any) => idx !== realIdx)}))
                            }} className="text-red-400 text-xs px-2 py-1 border border-red-300 rounded">삭제</button>
                          </div>
                        )
                      })}

                      {/* 인스타/틱톡 링크 */}
                      <div className="flex justify-between items-center mb-2 mt-4">
                        <label className="text-sm font-medium dark:text-gray-200">인스타/틱톡 링크</label>
                        <button onClick={() => setFormData((prev: any) => ({...prev, projectLinks: [...prev.projectLinks, { platform: 'instagram', url: '', isNew: true }]}))} className="text-xs bg-pink-600 text-white px-2 py-1 rounded">+ 추가</button>
                      </div>
                      {formData.projectLinks.filter((l: any) => ['instagram', 'tiktok'].includes(l.platform)).map((link: any, i: any) => {
                        const realIdx = formData.projectLinks.indexOf(link)
                        return (
                          <div key={i} className="flex gap-2 mt-2 items-center">
                            <select value={link.platform} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].platform = e.target.value
                              setFormData((prev: any) => ({...prev, projectLinks: newLinks}))
                            }} className="border rounded-lg px-2 py-2 text-base box-border dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <option value="instagram">인스타그램</option>
                              <option value="tiktok">틱톡</option>
                            </select>
                            <input value={link.url} onChange={(e) => {
                              const newLinks = [...formData.projectLinks]
                              newLinks[realIdx].url = e.target.value
                              setFormData((prev: any) => ({...prev, projectLinks: newLinks}))
                            }} className="flex-1 border rounded-lg px-3 py-2 text-base box-border dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="URL 입력" />
                            <button onClick={async () => {
                              if (!link.isNew && link.id) await fetchWithAuth(`/api/project_links?id=${link.id}`, { method: 'DELETE' })
                              setFormData((prev: any) => ({...prev, projectLinks: formData.projectLinks.filter((_: any, idx: any) => idx !== realIdx)}))
                            }} className="text-red-400 text-xs px-2 py-1 border border-red-300 rounded">삭제</button>
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">새로고침 주기 (추가 옵션)</label>
                      <select value={formData.refreshInterval} onChange={(e) => setFormData((prev: any) => ({...prev, refreshInterval: e.target.value}))} className={inputClass}>
                        <option value="12">기본 트래픽 - 일 2회 / 12시간 주기</option>
                        <option value="6" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>실버 트래픽 - 일 4회 / 6시간 주기 (150,000원)</option>
                        <option value="3" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>골드 트래픽 - 일 8회 / 3시간 주기 (300,000원)</option>
                        <option value="1" disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>다이아 VIP - 일 24회 / 1시간 주기 (800,000원)</option>
                      </select>
                      {(formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')) && (
                        <p className="text-xs text-red-400 mt-1">스탠다드 30은 트래픽 추가가 불가합니다. (기본 트래픽 일 2회 적용)</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">모니터링 기간 연장 (추가 옵션)</label>
                      <select value={formData.monitoringExtension} onChange={(e) => {
                        const days = Number(e.target.value)
                        setFormData((prev: any) => ({...prev, monitoringExtension: days}))
                        if (formData.startDate) {
                          const end = new Date(formData.startDate)
                          end.setDate(end.getDate() + 15 + days)
                          setFormData((prev: any) => ({...prev, monitoringExtension: days, endDate: end.toISOString().split('T')[0]}))
                        }
                      }} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="15">15일 연장 (200,000원)</option>
                        <option value="30">30일 연장 (400,000원)</option>
                        <option value="45">45일 연장 (600,000원)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">커버영상 옵션 (추가 옵션)</label>
                      <select value={formData.coverVideoCount} onChange={(e) => {
                        const count = Number(e.target.value)
                        setFormData((prev: any) => ({...prev, coverVideoCount: count, coverType: count > 0 ? (prev.coverType || 'normal') : 'normal'}))
                      }} className={inputClass}>
                        <option value="0">없음</option>
                        <option value="10">10개 (1,500,000원)</option>
                        <option value="20">20개 (3,000,000원)</option>
                        <option value="30">30개 (4,500,000원)</option>
                      </select>
                    </div>
                    {formData.coverVideoCount > 0 && (
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">커버 타입</label>
                      <select value={formData.coverType ?? 'normal'} onChange={(e) => {
                        const type = e.target.value
                        setFormData((prev: any) => ({...prev, coverType: type, coverVideoCount: type === 'premium' ? 3 : prev.coverVideoCount}))
                      }} className={inputClass}>
                        <option value="normal">일반 커버</option>
                        <option value="premium">프리미엄 커버</option>
                      </select>
                    </div>
                    )}
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">요청 게시물 수 (추가 옵션)</label>
                      <select value={formData.requiredPosts} onChange={(e) => setFormData((prev: any) => ({...prev, requiredPosts: e.target.value}))} className={inputClass}
                        disabled={formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')}>
                        <option value="1">1개</option>
                        <option value="2">2개 (+상품금액의 50%)</option>
                      </select>
                      {(formData.productContent.includes('스탠다드 30') || formData.productContent.includes('스탠다드30')) && (
                        <p className="text-xs text-red-400 mt-1">스탠다드 30은 게시물 추가가 불가합니다.</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">모집인원</label>
                      <input type="number" value={formData.maxParticipants} onChange={(e) => setFormData((prev: any) => ({...prev, maxParticipants: e.target.value}))} className={inputClass} placeholder="모집 인원 수 입력" />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">모집일</label>
                      <div className="flex gap-2">
                        <input type="date" value={formData.missionDate} onChange={(e) => setFormData((prev: any) => ({...prev, missionDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                        <select value={formData.missionTime} onChange={(e) => setFormData((prev: any) => ({...prev, missionTime: e.target.value}))} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">요청사항</label>
                      <textarea value={formData.requirements} onChange={(e) => setFormData((prev: any) => ({...prev, requirements: e.target.value}))} className={inputClass} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">프로젝트 상태</label>
                      <select value={formData.status} onChange={(e) => setFormData((prev: any) => ({...prev, status: e.target.value}))} className={inputClass}>
                        <option value="PENDING">대기중</option>
                        <option value="ONGOING">진행중</option>
                        <option value="COMPLETED">완료</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">시작일</label>
                      <div className="flex gap-2">
                        <input type="date" value={formData.startDate} onChange={(e) => {
                          if (e.target.value) {
                            const end = new Date(e.target.value)
                            end.setDate(end.getDate() + 15 + Number(formData.monitoringExtension))
                            setFormData((prev: any) => ({...prev, startDate: e.target.value, endDate: end.toISOString().split('T')[0]}))
                          } else {
                            setFormData((prev: any) => ({...prev, startDate: e.target.value}))
                          }
                        }} className={inputClass} style={dateInputStyle} />
                        <select value={formData.startTime} onChange={(e) => {
                          setFormData((prev: any) => ({...prev, startTime: e.target.value, endTime: e.target.value}))
                        }} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">종료일</label>
                      <div className="flex gap-2">
                        <input type="date" value={formData.endDate} onChange={(e) => setFormData((prev: any) => ({...prev, endDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                        <select value={formData.endTime} onChange={(e) => setFormData((prev: any) => ({...prev, endTime: e.target.value}))} className={inputClass}>
                          <option value="">시간 선택</option>
                          {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {Number(formData.requiredPosts) === 2 && (
                      <div>
                        <label className="text-sm font-medium dark:text-gray-200">2차 게시물 날짜</label>
                        <div className="flex gap-2">
                          <input type="date" value={formData.secondPostDate} onChange={(e) => setFormData((prev: any) => ({...prev, secondPostDate: e.target.value}))} className={inputClass} style={dateInputStyle} />
                          <select value={formData.secondPostTime} onChange={(e) => setFormData((prev: any) => ({...prev, secondPostTime: e.target.value}))} className={inputClass}>
                            <option value="">시간 선택</option>
                            {Array.from({length: 24}, (_, i) => (
                              <option key={i} value={`${String(i).padStart(2,'0')}:00`}>{`${String(i).padStart(2,'0')}:00`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium dark:text-gray-200">게시물당 금액 (체험단 지급)</label>
                      <input type="number" value={formData.rewardPerPost} onChange={(e) => setFormData((prev: any) => ({...prev, rewardPerPost: e.target.value}))} className={inputClass} placeholder="기본값: 2,500원" />
                      <p className="text-xs text-gray-400 mt-1">※ 미입력 시 기본값 2,500원으로 등록됩니다</p>
                    </div>
                    <div>
                      {selectedProject ? (
                        <>
                          <button onClick={handleUpdate} disabled={isSaving} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium mb-2 disabled:bg-gray-400">{isSaving ? '저장 중...' : '정보 수정하기'}</button>
                          <button onClick={async () => {
                            if (!formData.selectedClientId) { showToast('의뢰인을 선택해주세요.'); return }
                            
                            // 총비용 계산
                            const totalCost = getTotalCost()
                            const optionsText = [
                              formData.refreshInterval ? ({'12':'기본 트래픽','6':'실버 트래픽','3':'골드 트래픽','1':'다이아 VIP'} as any)[String(formData.refreshInterval)] : '',
                              Number(formData.monitoringExtension) > 0 ? `모니터링 ${formData.monitoringExtension}일 연장` : '',
                              Number(formData.coverVideoCount) > 0 ? `커버영상 ${formData.coverVideoCount}개` : '',
                              Number(formData.requiredPosts) > 1 ? `게시물 ${formData.requiredPosts}개` : '',
                              formData.optionName || ''
                            ].filter(Boolean).join(' / ')
                            const confirmed = confirm(
                              `계약서를 발송하시겠어요?\n\n` +
                              `의뢰인: ${formData.clientName}\n` +
                              `가수명: ${formData.artistName || '-'}\n` +
                              `곡명: ${formData.songTitle}\n` +
                              `상품: ${formData.productContent}${optionsText ? ` + ${optionsText}` : ''}\n` +
                              `계약금액: ${totalCost.toLocaleString()}원\n` +
                              `계약기간: ${formData.startDate} ~ ${formData.endDate}\n\n` +
                              `위 내용으로 계약서를 발송합니다.`
                            )
                            if (!confirmed) return

                            const clientRes = await fetchWithAuth(`/api/users?client_id=${formData.selectedClientId}`)
                            const clientData = await clientRes.json()
                            const client = clientData?.[0]
                            if (!client) { showToast('의뢰인 정보를 찾을 수 없어요.'); return }
                            
                            const res = await fetchWithAuth('/api/eformsign?action=send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clientName: formData.clientName,
                                clientEmail: client.email,
                                clientMobile: client.mobile,
                                projectCode: formData.projectCode.toUpperCase(),
                                productContent: formData.productContent,
                                songTitle: formData.songTitle,
                                totalCost: totalCost,
                                startDate: formData.startDate,
                                endDate: formData.endDate,
                                artistName: formData.artistName,
                                optionName: formData.optionName,
                                refreshInterval: formData.refreshInterval,
                                monitoringExtension: formData.monitoringExtension,
                                coverVideoCount: formData.coverVideoCount,
                                requiredPosts: formData.requiredPosts
                              })
                            })
                            const data = await res.json()
                            console.log('eformsign result:', JSON.stringify(data))
                            if (data.success) {
                              await fetchWithAuth(`/api/projects?project_code=${formData.projectCode.toUpperCase()}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ document_id: data.document_id, total_cost: totalCost })
                              })
                              // 의뢰인에게 푸시
                              const clientTokensRes = await fetchWithAuth(`/api/push_tokens?user_id=${String(client.id)}`)
                              const clientTokens = await clientTokensRes.json()
                              if (clientTokens && clientTokens.length > 0) {
                                await fetch('/api/push', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: '📄 계약서가 발송됐어요!',
                                    body: '계약서를 확인하고 서명해주세요.',
                                    data: { url: '/client' },
                                    tokens: clientTokens.map((t: any) => t.token),
                                    userIds: [String(client.id)]
                                  })
                                })
                              }
                              showToast('계약서 발송 완료!')
                            } else {
                              showToast('계약서 발송 실패!')
                            }
                          }} className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium">📄 계약서 발송</button>
                        </>
                      ) : (
                        <button onClick={handleInsert} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">프로젝트 등록</button>
                      )}
                    </div>
                  </div>

                  {selectedProject && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-400 mb-2">⚠️ 위험 구역</p>
                      <button onClick={async () => {
                        const input = prompt(`프로젝트를 삭제하려면 프로젝트 코드를 입력하세요.

코드: ${selectedProject.project_code}`)
                        if (input !== selectedProject.project_code) { showToast('코드가 일치하지 않아요.'); return }
                        if (!confirm('정말 삭제하시겠어요? 이 작업은 되돌릴 수 없어요.')) return
                        await fetchWithAuth(`/api/projects?project_code=${selectedProject.project_code}`, { method: 'DELETE' })
                        showToast('프로젝트가 삭제됐어요.')
                        window.location.reload()
                      }} className="w-full bg-red-50 text-red-500 border border-red-300 rounded-lg py-2 text-sm font-medium">
                        🗑️ 프로젝트 삭제
                      </button>
                    </div>
                  )}
    </>
  )
}
