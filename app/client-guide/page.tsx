import { Metadata } from 'next'
import BackButton from './BackButton'
import { FileText, BarChart2, Users, Pin } from 'lucide-react'

export const metadata: Metadata = {
  title: '더블비뮤직 의뢰인 이용안내',
}

export default function ClientGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{wordBreak: "keep-all"}}>
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold dark:text-white">의뢰인 공식 이용안내</h1>
          </div>
        </div>

        {/* 1. 서비스 개요 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">1. 서비스 개요</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">더블비뮤직은 레이블·아티스트의 신곡을 수백 명의 체험단이 인스타그램, 유튜브, 틱톡에 자연스럽게 소개하도록 연결하고, 게시물 현황과 조회수·좋아요 통계를 실시간으로 확인할 수 있는 음악 마케팅 플랫폼입니다.</p>
        </div>

        {/* 2. 가입 방법 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">2. 가입 방법</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">앱 다운로드 및 정보 입력</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">더블비뮤직 앱을 다운로드한 후 [의뢰인 가입]을 선택하여 대표자명, 이메일, 비밀번호를 입력합니다. 소속사명과 아티스트명은 선택사항으로, 입력해두시면 이후 프로젝트 진행이 더 수월합니다.</p>
            </div>
          </div>
        </div>

        {/* 3. 프로젝트 신청 방법 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">3. 프로젝트 신청 방법</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">앱 내 [프로젝트 신청] 버튼을 눌러 아래 정보를 입력하면, 검토 후 담당자가 연락드립니다.</p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-gray-600 dark:text-gray-300">· 가수명 / 아티스트명, 노래 제목</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">· 희망 미션 시작일 (음원 발매일 기준)</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">· 커버 옵션 추가 여부 및 커버 인원</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">· 원곡 음원·MR 파일 (커버 옵션 선택 시, wav/mp3)</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">· 책정 예산, 자켓 이미지, 요청사항</p>
          </div>
        </div>

        {/* 4. 프로젝트 진행 및 확인 방법 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">4. 프로젝트 진행 및 확인 방법</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white flex items-center gap-1"><BarChart2 size={14} /> 실시간 캠페인 확인</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">계약된 가수 및 곡명을 클릭하면 캠페인 진행상황을 실시간으로 모니터링할 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white flex items-center gap-1"><FileText size={14} /> 계약서 다운로드</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">상단 메뉴에서 계약서를 언제든지 다운로드할 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white flex items-center gap-1"><FileText size={14} /> 결과보고서 자동 생성</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">프로젝트 종료와 동시에 결과보고서가 자동으로 생성됩니다. 별도 요청 없이 앱에서 바로 확인 가능합니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white flex items-center gap-1"><Users size={14} /> 하단 바를 통한 페이지 이동</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">하단 네비게이션 바를 통해 대시보드, 게시물 목록, 결과보고서, 계약서 등 각 페이지로 빠르게 이동합니다.</p>
            </div>
          </div>
        </div>

        {/* 5. 커버 옵션 안내 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-purple-600 dark:text-purple-400 mb-3">5. 커버 옵션 안내</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">커버를 옵션으로 선택하신 경우, 커버 체험단을 직접 선택하고 커버영상을 통해 프로젝트를 홍보할 수 있습니다.</p>
          <div className="space-y-2">
            <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">커버 체험단 선택</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">미션 시작 후 3일 이내에 커버 페이지에서 커버할 체험단을 직접 선택할 수 있습니다. 선택 후 체험단이 수락하면 커버 작업이 진행됩니다. 3일이 지나면 관리자가 대신 배정을 도와드립니다.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm font-medium dark:text-white">원곡·MR 미리듣기</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">신청 시 등록해주신 원곡 음원은 커버 페이지에서 바로 재생하여 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* 6. 주요 안내사항 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1"><Pin size={16} /> 6. 주요 안내사항</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">게시물 링크 바로가기</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">게시물 목록에서 '링크보기'를 누르면 게시자의 실제 계정으로 바로 이동하여 업로드된 콘텐츠를 직접 확인할 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">총 음원사용량 안내</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">표시되는 총 음원사용량은 체험단을 포함한 전세계 총 사용량을 의미합니다.</p>
              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-2 mt-2">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">유튜브 음원사용량은 플랫폼 정책상 목록으로 직접 제공되지 않아, 인스타그램·틱톡과 달리 정확한 사용 건수 확인이 어려운 점 양해 부탁드립니다.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">요청사항을 통한 체험단과 소통</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">요청사항란은 체험단과 소통하는 창구이며, 게시물에 들어갈 필수 문구와 해시태그를 적어주시면 됩니다.</p>
            </div>
          </div>
        </div>

        {/* Q&A */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">자주 묻는 질문 (Q&A)</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Q1. 프로젝트 신청 후 얼마나 걸리나요?',
                a: '신청서를 제출하시면 담당자가 검토 후 개별 연락드립니다. 신청 즉시 프로젝트가 자동으로 생성되는 것은 아니며, 협의를 거쳐 정식 프로젝트로 등록됩니다.'
              },
              {
                q: 'Q2. 체험단을 직접 선택할 수 있나요?',
                a: '커버 옵션을 선택하신 경우에 한해 커버 체험단을 직접 선택할 수 있습니다. 일반 체험단은 앱에서 자율적으로 참여를 신청하는 방식으로 모집됩니다.'
              },
              {
                q: 'Q3. 결과보고서는 언제 받을 수 있나요?',
                a: '프로젝트가 종료되면 결과보고서가 자동으로 생성되어 앱에서 바로 확인·다운로드하실 수 있습니다. 별도로 요청하실 필요가 없습니다.'
              },
              {
                q: 'Q4. 통계는 얼마나 자주 갱신되나요?',
                a: '선택하신 상품에 따라 1~12시간 간격으로 게시물의 좋아요·댓글·조회수 데이터가 자동 갱신됩니다.'
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{item.q}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">더블비뮤직 · 대표: 최병민 · 사업자등록번호: 659-87-03644</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">서울특별시 강남구 역삼로 228, 한성빌딩 4층 407호</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">고객센터: 070-8065-5811</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">COPYRIGHT 2026. 더블비뮤직 ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  )
}
