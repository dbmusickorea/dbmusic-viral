'use client'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <button onClick={() => router.back()} className="text-sm text-blue-600 mb-4 block">← 뒤로가기</button>
        <h1 className="text-xl font-bold mb-6">이용약관</h1>
        <p className="text-xs text-gray-500 mb-6">시행일: 2026년 7월 12일</p>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제1조 (목적)</h2>
          <p className="text-sm text-gray-600">이 약관은 더블비뮤직(이하 "회사")이 제공하는 DBMUSIC 바이럴 마케팅 플랫폼 서비스의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제2조 (정의)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>"서비스"란 회사가 제공하는 바이럴 마케팅 관련 플랫폼 및 부가 서비스를 말합니다.</li>
            <li>"의뢰인"이란 서비스를 통해 바이럴 마케팅을 의뢰하는 개인 또는 법인을 말합니다.</li>
            <li>"체험단"이란 서비스를 통해 바이럴 미션을 수행하고 보상을 받는 개인을 말합니다.</li>
            <li>"포인트"란 체험단이 미션 수행 후 지급받는 가상의 보상 단위를 말합니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제3조 (약관의 효력 및 변경)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.</li>
            <li>회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.</li>
            <li>변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제4조 (회원가입)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>서비스 이용을 위해서는 회원가입이 필요합니다.</li>
            <li>만 14세 미만은 회원가입이 제한됩니다.</li>
            <li>허위 정보로 가입한 경우 서비스 이용이 제한될 수 있습니다.</li>
            <li>1인 1계정 원칙을 준수해야 합니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제5조 (서비스 이용)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>체험단은 미션 시작일로부터 48시간 이내에 게시물을 업로드해야 합니다.</li>
            <li>미션 미수행 시 레벨 하락 및 7일간 활동이 제한될 수 있습니다.</li>
            <li>커버영상 미션은 미션 시작일로부터 7일 이내에 업로드해야 합니다.</li>
            <li>커버영상 미션 미수행 시 3개월간 커버영상 미션 참여가 제한됩니다.</li>
            <li>게시물 삭제 또는 비공개 처리 시 포인트가 회수될 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제6조 (포인트 및 정산)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>포인트는 미션 수행 완료 후 지급됩니다.</li>
            <li>환전 신청 시 휴일을 제외한 1영업일 이내 입금됩니다.</li>
            <li>정산 금액에 대해 소득세법에 따른 원천징수(3.3%)가 적용됩니다.</li>
            <li>정산을 위해 실명 계좌 정보 및 주민등록번호 제공이 필요합니다.</li>
            <li>부정한 방법으로 취득한 포인트는 회수될 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제7조 (금지 행위)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>타인의 계정을 도용하거나 허위 정보를 등록하는 행위</li>
            <li>게시물을 실제로 업로드하지 않고 허위 제출하는 행위</li>
            <li>자동화 프로그램을 이용한 부정 활동</li>
            <li>다중 계정 생성 및 운영</li>
            <li>음원 유출 및 저작권 침해 행위</li>
            <li>서비스 운영을 방해하는 일체의 행위</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제8조 (서비스 중단 및 회원 제재)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>회사는 서비스 유지보수, 기술적 문제 등으로 서비스를 일시 중단할 수 있습니다.</li>
            <li>금지 행위 위반 시 서비스 이용 제한 또는 강제 탈퇴 조치가 취해질 수 있습니다.</li>
            <li>부정 취득 포인트 및 정산금은 환수 조치될 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제9조 (책임의 한계)</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
            <li>회사는 천재지변, 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
            <li>이용자의 귀책사유로 발생한 손해에 대해 회사는 책임지지 않습니다.</li>
            <li>이용자 간 분쟁에 대해 회사는 개입 의무가 없습니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">제10조 (분쟁 해결)</h2>
          <p className="text-sm text-gray-600">서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 이용자는 상호 협의하여 해결하며, 협의가 이루어지지 않을 경우 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold mb-2">문의</h2>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>회사명: 더블비뮤직</li>
            <li>이메일: db_music@naver.com</li>
            <li>전화: 010-3433-3806</li>
          </ul>
        </section>
      </div>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-6 right-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 z-50">↑</button>
    </div>
  )
}
