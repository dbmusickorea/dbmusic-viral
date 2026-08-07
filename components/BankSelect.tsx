'use client'

export const BANK_LIST = [
  { code: "002", name: "산업은행" },
  { code: "003", name: "기업은행" },
  { code: "004", name: "국민은행" },
  { code: "007", name: "수협은행" },
  { code: "011", name: "농협은행" },
  { code: "020", name: "우리은행" },
  { code: "023", name: "SC제일은행" },
  { code: "027", name: "한국씨티은행" },
  { code: "032", name: "대구은행" },
  { code: "034", name: "광주은행" },
  { code: "035", name: "제주은행" },
  { code: "037", name: "전북은행" },
  { code: "039", name: "경남은행" },
  { code: "045", name: "새마을금고" },
  { code: "048", name: "신협" },
  { code: "050", name: "저축은행" },
  { code: "064", name: "산림조합" },
  { code: "071", name: "우체국" },
  { code: "081", name: "하나은행" },
  { code: "088", name: "신한은행" },
  { code: "089", name: "케이뱅크" },
  { code: "090", name: "카카오뱅크" },
  { code: "092", name: "토스뱅크" },
  { code: "209", name: "유안타증권" },
  { code: "218", name: "KB증권" },
  { code: "238", name: "미래에셋증권" },
  { code: "240", name: "삼성증권" },
  { code: "243", name: "한국투자증권" },
  { code: "247", name: "NH투자증권" },
  { code: "261", name: "교보증권" },
  { code: "262", name: "하이투자증권" },
  { code: "263", name: "현대차증권" },
  { code: "264", name: "키움증권" },
  { code: "265", name: "이베스트투자증권" },
  { code: "266", name: "SK증권" },
  { code: "267", name: "대신증권" },
  { code: "269", name: "한화투자증권" },
  { code: "270", name: "하나증권" },
  { code: "271", name: "토스증권" },
  { code: "278", name: "신한투자증권" },
  { code: "279", name: "DB금융투자" },
  { code: "280", name: "유진투자증권" },
  { code: "287", name: "메리츠증권" },
  { code: "290", name: "부국증권" },
  { code: "291", name: "신영증권" },
  { code: "292", name: "케이프투자증권" },
  { code: "294", name: "한국포스증권" },
]

export const BANK_NAME_MAP: Record<string, string> = Object.fromEntries(BANK_LIST.map(b => [b.code, b.name]))

interface BankSelectProps {
  value: string
  onChange: (code: string, name: string) => void
  className?: string
}

export default function BankSelect({ value, onChange, className }: BankSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const code = e.target.value
        onChange(code, BANK_NAME_MAP[code] ?? '')
      }}
      className={className ?? 'w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm mt-1 dark:bg-gray-700 dark:text-white'}
    >
      <option value="">은행 선택</option>
      {BANK_LIST.map(b => (
        <option key={b.code} value={b.code}>{b.name}</option>
      ))}
    </select>
  )
}
