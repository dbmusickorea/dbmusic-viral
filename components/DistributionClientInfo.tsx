'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Lock, AlertTriangle, Upload, FileText } from 'lucide-react'
import { supabase } from '../app/lib/supabase'

type Props = {
  userInfo: any
  fetchWithAuth: (url: string, options?: any) => Promise<Response>
  showToast: (msg: string) => void
  onSaved: () => void
  isAdmin?: boolean
}

const DIST_FIELDS = [
  { key: 'dist_nationality', label: '국적' },
  { key: 'dist_mims_name', label: 'MIMS 가입자명' },
  { key: 'dist_entity_type', label: '개인/사업자 구분', type: 'select', options: [{ v: '개인', l: '개인' }, { v: '사업자', l: '사업자' }] },
  { key: 'dist_business_type', label: '사업자 유형', type: 'select', options: [{ v: '개인사업자', l: '개인사업자' }, { v: '법인사업자', l: '법인사업자' }], showIf: (f: any) => f.dist_entity_type === '사업자' },
  { key: 'dist_tax_exempt', label: '면세사업자 여부', type: 'select', options: [{ v: 'Y', l: '예' }, { v: 'N', l: '아니오' }] },
  { key: 'dist_real_name', label: '이름' },
  { key: 'company', label: '회사명' },
  { key: 'dist_phone', label: '전화번호' },
  { key: 'dist_currency', label: '정산화폐' },
  { key: 'dist_payment_method', label: '지급방법' },
  { key: 'dist_residence_country', label: '거주지 국가' },
]

const TAX_FIELDS = [
  { key: 'dist_business_number', label: '사업자등록번호' },
  { key: 'dist_birth_or_founding_date', label: '생년월일(회사설립일)', type: 'date' },
  { key: 'dist_address', label: '거주지주소(사업장소재지)' },
]

const PAYMENT_FIELDS = [
  { key: 'dist_bank_account_holder', label: '예금주' },
  { key: 'dist_bank_account_number', label: '계좌번호' },
  { key: 'dist_bank_code', label: 'Bank Code' },
  { key: 'dist_bank_name', label: '은행명' },
]

function FormSection({ title, fields, form, setForm, locked, extra }: any) {
  const visibleFields = fields.filter((f: any) => !f.showIf || f.showIf(form))
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <h2 className="font-bold dark:text-white mb-4">{title}</h2>
      {locked ? (
        <div className="space-y-3">
          {visibleFields.map((f: any) => (
            <div key={f.key} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
              <p className="text-sm font-medium dark:text-white">
                {f.key === 'dist_tax_exempt' ? (form[f.key] === 'Y' ? '예' : form[f.key] === 'N' ? '아니오' : '-') : (form[f.key] || '-')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFields.map((f: any) => (
            <div key={f.key}>
              <label className="text-sm font-medium dark:text-white">{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.key] ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white">
                  <option value="">선택</option>
                  {f.options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ) : (
                <input type={f.type === 'date' ? 'date' : 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white" />
              )}
            </div>
          ))}
        </div>
      )}
      {extra}
    </div>
  )
}

export default function DistributionClientInfo({ userInfo, fetchWithAuth, showToast, onSaved, isAdmin = false }: Props) {
  const isReallyLocked = !!userInfo?.dist_info_locked
  const locked = isReallyLocked && !isAdmin
  const allFields = [...DIST_FIELDS, ...TAX_FIELDS, ...PAYMENT_FIELDS]
  const initial: any = {}
  allFields.forEach(f => { initial[f.key] = userInfo?.[f.key] ?? '' })
  const [form, setForm] = useState<any>(initial)
  const [saving, setSaving] = useState(false)
  const [certUrl, setCertUrl] = useState<string>(userInfo?.dist_business_cert_url ?? '')
  const [uploadingCert, setUploadingCert] = useState(false)
  const [paymentSlot, setPaymentSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPaymentSlot(document.getElementById('dist-payment-slot'))
  }, [])

  const handleFileUpload = async (file: File) => {
    setUploadingCert(true)
    const path = `${userInfo.id}_${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage.from('distribution-documents').upload(path, file, { upsert: true })
    setUploadingCert(false)
    if (error || !data) { showToast('업로드에 실패했어요. 다시 시도해주세요.'); return }
    const { data: urlData } = supabase.storage.from('distribution-documents').getPublicUrl(data.path)
    setCertUrl(urlData.publicUrl)
    showToast('사업자등록증이 업로드됐어요. 저장 버튼을 눌러주세요.')
  }

  const handleSave = async () => {
    const emptyRequired = allFields.filter((f: any) => (!f.showIf || f.showIf(form)) && !form[f.key]?.toString().trim())
    if (emptyRequired.length > 0) {
      showToast(`모든 항목을 입력해주세요. (${emptyRequired[0].label} 등)`)
      return
    }
    const ok = window.confirm(isAdmin ? '저장하시겠어요?' : '한 번 저장하면 본인이 직접 수정할 수 없고, 변경 시 고객센터로 문의해야 해요. 저장하시겠어요?')
    if (!ok) return
    setSaving(true)
    const body: any = {}
    allFields.forEach(f => { body[f.key] = form[f.key] })
    body.dist_business_cert_url = certUrl
    const res = await fetchWithAuth(`/api/users?id=${userInfo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    setSaving(false)
    if (!res.ok) { showToast('저장에 실패했어요. 다시 시도해주세요.'); return }
    showToast(isAdmin ? '✅ 저장 완료!' : '✅ 저장 완료! 이후 수정은 고객센터로 문의해주세요.')
    onSaved()
  }

  const rightColumnSection = (
    <>
      <FormSection title="세금정보" fields={TAX_FIELDS} form={form} setForm={setForm} locked={locked} extra={
        <div className="mt-3">
          <label className="text-sm font-medium dark:text-white">사업자등록증</label>
          {certUrl ? (
            <a href={certUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-sm text-blue-500 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
              <FileText size={14} /> 첨부파일 보기
            </a>
          ) : (
            <p className="text-xs text-gray-400 mt-1">등록된 파일이 없어요.</p>
          )}
          {!locked && (
            <label className="mt-2 flex items-center justify-center gap-1.5 text-sm border dark:border-gray-600 rounded-lg py-2 cursor-pointer text-gray-600 dark:text-gray-300">
              <Upload size={14} /> {uploadingCert ? '업로드 중...' : certUrl ? '다시 업로드' : '파일 업로드'}
              <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploadingCert} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
            </label>
          )}
        </div>
      } />
      <FormSection title="지급정보" fields={PAYMENT_FIELDS} form={form} setForm={setForm} locked={locked} />
      {!locked && (
        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium disabled:bg-gray-400 mb-4">
          {saving ? '저장 중...' : '저장하기'}
        </button>
      )}
    </>
  )

  return (
    <>
      {locked && (
        <div className="bg-orange-50 dark:bg-gray-700 border-l-4 border-orange-400 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-orange-700 dark:text-orange-200 flex items-center gap-1"><Lock size={14} /> 정보가 등록되어 잠겨있어요</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-0.5"><AlertTriangle size={10} /> 변경이 필요하면 고객센터로 문의해주세요.</p>
        </div>
      )}
      {isAdmin && isReallyLocked && (
        <div className="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 rounded-2xl p-4 mb-4">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-200 flex items-center gap-1"><Lock size={14} /> 의뢰인이 등록을 완료한 정보예요</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">관리자는 수정하고 저장할 수 있어요.</p>
        </div>
      )}
      <FormSection title="유통정보" fields={DIST_FIELDS} form={form} setForm={setForm} locked={locked} />
      {paymentSlot ? (
        <>
          {/* 모바일: 자연스러운 순서로 표시 */}
          <div className="md:hidden">
            {rightColumnSection}
          </div>
          {/* 데스크탑: 오른쪽 칼럼 슬롯으로 이동 */}
          {createPortal(rightColumnSection, paymentSlot)}
        </>
      ) : (
        // 슬롯이 없는 화면(예: 관리자 화면)에서는 그냥 이어서 표시
        rightColumnSection
      )}
    </>
  )
}
