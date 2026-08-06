'use client'
import { useRouter } from 'next/navigation'
import { Music, Users, BarChart2, FileText, Shield } from 'lucide-react'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{paddingTop: 'max(1rem, env(safe-area-inset-top))'}}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-blue-600 mb-4 block">← 뒤로가기</button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4 text-center">
          <h1 className="text-2xl font-bold dark:text-white mb-2">더블비뮤직</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">음악 바이럴 마케팅 플랫폼</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">app.doubleb.kr</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4">
          <h2 className="font-bold mb-3 dark:text-white">서비스 소개</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            더블비뮤직은 음원 발매 아티스트와 SNS 인플루언서(체험단)를 연결하는 바이럴 마케팅 플랫폼입니다.
            체험단이 SNS에 음원을 활용한 게시물을 업로드하면 리워드를 지급하며,
            의뢰인(아티스트/소속사)은 실시간으로 캠페인 현황을 모니터링할 수 있습니다.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4">
          <h2 className="font-bold mb-4 dark:text-white">주요 기능</h2>
          <div className="space-y-4">
            {[
              { icon: <Music size={16} className="text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900', title: '캠페인 관리', desc: '음원 바이럴 캠페인을 등록하고 체험단을 모집·관리합니다.' },
              { icon: <Users size={16} className="text-green-600 dark:text-green-400" />, bg: 'bg-green-100 dark:bg-green-900', title: '체험단 매칭', desc: '인스타그램, 유튜브, 틱톡 인플루언서와 아티스트를 연결합니다.' },
              { icon: <BarChart2 size={16} className="text-purple-600 dark:text-purple-400" />, bg: 'bg-purple-100 dark:bg-purple-900', title: '실시간 통계', desc: '좋아요, 댓글, 조회수 등 SNS 게시물 통계를 실시간으로 확인합니다.' },
              { icon: <FileText size={16} className="text-orange-600 dark:text-orange-400" />, bg: 'bg-orange-100 dark:bg-orange-900', title: '보고서 및 정산', desc: '캠페인 결과 보고서 제공 및 체험단 리워드 정산을 지원합니다.' },
              { icon: <Shield size={16} className="text-red-600 dark:text-red-400" />, bg: 'bg-red-100 dark:bg-red-900', title: '본인인증', desc: '회원가입 시 휴대폰 본인인증을 통해 안전한 서비스를 제공합니다.' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>{icon}</div>
                <div>
                  <p className="text-sm font-medium dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4">
          <h2 className="font-bold mb-3 dark:text-white">이용 대상</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">의뢰인</span> - 음원 바이럴 마케팅을 원하는 아티스트 및 소속사</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">체험단</span> - SNS 팔로워 100명 이상의 인플루언서</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4">
          <h2 className="font-bold mb-3 dark:text-white">약관 및 정책</h2>
          <div className="space-y-2">
            <button onClick={() => router.push('/terms')} className="w-full text-left text-sm text-blue-600 dark:text-blue-400 py-2 border-b dark:border-gray-700">이용약관 →</button>
            <button onClick={() => router.push('/privacy')} className="w-full text-left text-sm text-blue-600 dark:text-blue-400 py-2">개인정보 처리방침 →</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-4">
          <h2 className="font-bold mb-3 dark:text-white">사업자 정보</h2>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p>상호명: 더블비뮤직</p>
            <p>대표자: 최병민</p>
            <p>사업자등록번호: 280-02-02331</p>
            <p>이메일: db_music@naver.com</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-8">© 2026 더블비뮤직. All rights reserved.</p>
      </div>
    </div>
  )
}
