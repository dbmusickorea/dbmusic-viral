'use client'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <button onClick={() => router.back()} className="text-sm text-blue-600 mb-4 block">← 뒤로가기</button>
        <h1 className="text-xl font-bold mb-6">개인정보 처리방침</h1>
        
        <p className="text-xs text-gray-500 mb-6">시행일: 2026년 7월 12일</p>

        <section className="mb-6">
          <h2 className="font-bold mb-2">1. 개인정보 수집 항목</h2>
          <p className="text-sm text-gray-600">더블비뮤직(이하 "회사")은 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>필수: 이름, 이메일, 휴대전화번호, 비밀번호</li>
            <li>정산 시: 주민등록번호, 계좌번호, 예금주명, 은행명</li>
            <li>SNS 활동: 인스타그램/유튜브/틱톡 계정 ID</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">2. 개인정보 수집 및 이용 목적</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>바이럴 마케팅 서비스 제공 및 운영</li>
            <li>회원 식별 및 본인 확인</li>
            <li>활동 보상금 정산 및 지급</li>
            <li>세금 신고를 위한 원천징수</li>
            <li>서비스 관련 공지 및 안내</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">3. 개인정보 보유 및 이용 기간</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>회원 탈퇴 시까지</li>
            <li>정산 관련 정보: 관련 법령에 따라 5년간 보관</li>
            <li>단, 관련 법령에 의해 보존이 필요한 경우 해당 기간까지 보관</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">4. 개인정보의 제3자 제공</h2>
          <p className="text-sm text-gray-600">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 아래의 경우는 예외입니다.</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">5. 개인정보 보호 조치</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>계좌번호 및 주민등록번호는 AES-256 암호화하여 저장</li>
            <li>비밀번호는 암호화하여 저장하며 관리자도 확인 불가</li>
            <li>개인정보 접근 권한을 최소화하여 관리</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">6. 이용자의 권리</h2>
          <p className="text-sm text-gray-600">이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>개인정보 열람 요청</li>
            <li>개인정보 수정 요청</li>
            <li>개인정보 삭제 요청 (회원 탈퇴)</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">7. 개인정보 처리 담당자</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>회사명: 더블비뮤직</li>
            <li>성명: 함현철</li>
            <li>직책: 개인정보 보호책임자</li>
            <li>이메일: db_music@naver.com</li>
            <li>전화: 010-3433-3806</li>
            <li>문의: 앱 내 의뢰인 문의 기능을 통해 접수</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">8. 개인정보처리방침 변경</h2>
          <p className="text-sm text-gray-600">이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 변경될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.</p>
        </section>

      </div>
    {/* 스크롤 상단 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50"
      >
        ↑
      </button>
    </div>
  )
}