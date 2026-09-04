'use client'

import { useRouter } from 'next/navigation'

export default function DistributionIntroPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
          <img src="/DBMUSIC_DISTRIBUTION_HEADER.svg" alt="DBMUSIC DISTRIBUTION" className="h-7 invert" />
          <button onClick={() => router.push('/')} className="text-sm bg-white text-gray-900 rounded-lg px-4 py-2 font-medium">
            로그인
          </button>
        </div>
      </div>

      {/* 히어로 섹션 */}
      <div className="relative px-4 md:px-8 py-20 md:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 opacity-80" />
        <div className="relative">
          <p className="text-sm md:text-base text-blue-300 mb-3">클릭 한 번으로</p>
          <h1 className="text-2xl md:text-5xl font-bold leading-tight mb-4">
            국내외 주요 뮤직스토어에<br />내 음악을 유통해보세요!
          </h1>
          <button onClick={() => router.push('/')} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-3 font-medium text-sm md:text-base">
            지금 시작하기
          </button>
        </div>
      </div>

      {/* 특징 카드 */}
      <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <p className="text-blue-400 font-bold text-lg mb-1">GLOBAL</p>
            <p className="text-xs text-gray-400">국내외 음원유통</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <p className="text-blue-400 font-bold text-lg mb-1">다수</p>
            <p className="text-xs text-gray-400">제휴 뮤직스토어</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <p className="text-blue-400 font-bold text-lg mb-1">간편</p>
            <p className="text-xs text-gray-400">등록 절차</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-center">
            <p className="text-blue-400 font-bold text-lg mb-1">투명</p>
            <p className="text-xs text-gray-400">정산 보고서</p>
          </div>
        </div>
      </div>

      {/* 서비스 소개 */}
      <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-2">음원 유통 서비스란?</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            더블비뮤직 유통 서비스는 아티스트와 레이블이 만든 음원을 국내외 주요 뮤직스토어(멜론, 지니, 벅스, 유튜브뮤직, 스포티파이 등)에 등록하고 유통할 수 있도록 도와드리는 서비스예요. 발매 신청부터 정산까지 한 곳에서 편리하게 관리하세요.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2">누가 이용할 수 있나요?</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            음원을 발매하고 싶은 아티스트, 소속사, 레이블이라면 누구나 이용하실 수 있어요. 자세한 이용 안내는 로그인 후 확인하실 수 있어요.
          </p>
        </div>
      </div>

      {/* 유통 방법 안내 */}
      <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto border-t border-gray-800">
        <h2 className="text-lg font-bold mb-6">유통 방법 안내</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: '회원가입', desc: '의뢰인으로 가입 후 이용 신청' },
            { step: '2', title: '발매 신청', desc: '앨범 정보와 음원 파일 등록' },
            { step: '3', title: '심사/승인', desc: '담당자 검토 후 유통 준비' },
            { step: '4', title: '유통 시작', desc: '주요 뮤직스토어에 순차 등록' },
          ].map((s) => (
            <div key={s.step} className="bg-gray-800 rounded-2xl p-5">
              <p className="text-blue-400 font-bold text-sm mb-1">STEP {s.step}</p>
              <p className="font-medium mb-1">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-6">
          유통 서비스 이용 문의는 고객센터(070-8065-5811)로 연락해주세요.
        </p>
      </div>

      {/* 유통 음원 */}
      <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto border-t border-gray-800">
        <h2 className="text-lg font-bold mb-6">유통 음원</h2>
        <p className="text-xs text-gray-500 text-center py-12">곧 만나보실 수 있어요.</p>
      </div>

      {/* 사업자 정보 */}
      <div className="px-4 md:px-8 py-8 text-center text-xs text-gray-500 border-t border-gray-800 space-y-1">
        <div className="flex justify-center gap-4 mb-3">
          <button onClick={() => router.push('/terms')} className="underline hover:text-gray-300">이용약관</button>
          <button onClick={() => router.push('/privacy')} className="underline hover:text-gray-300">개인정보처리방침</button>
        </div>
        <p>주식회사 더블비뮤직 · 대표: 최병민 · 사업자등록번호: 659-87-03644</p>
        <p>서울특별시 강남구 역삼로 228, 한성빌딩 4층 407호</p>
        <p>고객센터: 070-8065-5811</p>
        <p className="pt-2">© Double B Music Co.,Ltd. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  )
}
