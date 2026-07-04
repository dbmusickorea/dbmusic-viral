export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">개인정보 처리방침</h1>
      
      <p className="text-sm text-gray-500 mb-6">시행일: 2026년 1월 1일</p>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">1. 수집하는 개인정보 항목</h2>
        <p className="text-sm text-gray-700">더블비뮤직(이하 "회사")은 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
          <li>이름, 이메일 주소, 휴대전화번호</li>
          <li>은행명, 계좌번호, 예금주</li>
          <li>SNS 계정 정보 (인스타그램, 유튜브, 틱톡)</li>
          <li>주민등록번호 (정산 시)</li>
          <li>주소 (정산 시)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">2. 개인정보 수집 및 이용 목적</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>바이럴 마케팅 서비스 제공</li>
          <li>정산 및 세금 처리</li>
          <li>서비스 이용 관련 공지사항 전달</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">3. 개인정보 보유 및 이용 기간</h2>
        <p className="text-sm text-gray-700">회원 탈퇴 시까지 보유하며, 관련 법령에 따라 일정 기간 보관할 수 있습니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">4. 개인정보 제3자 제공</h2>
        <p className="text-sm text-gray-700">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는 예외로 합니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">5. 개인정보 처리 위탁</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Supabase: 데이터베이스 관리</li>
          <li>Vercel: 서버 호스팅</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">6. 이용자의 권리</h2>
        <p className="text-sm text-gray-700">이용자는 언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2">7. 개인정보 보호책임자</h2>
        <p className="text-sm text-gray-700">이메일: db.music.korea@gmail.com</p>
      </section>

      <p className="text-sm text-gray-500 mt-8">© 2026 더블비뮤직. All rights reserved.</p>
    </div>
  )
}