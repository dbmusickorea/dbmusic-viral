import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '더블비뮤직 크리에이터 가이드',
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <h1 className="text-xl font-bold">📖 크리에이터 공식 사용설명서</h1>
        </div>

        {/* 1. 서비스 개요 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-2">1. 서비스 개요</h2>
          <p className="text-sm text-gray-600 leading-relaxed">더블비뮤직은 발매되는 신곡 음원을 본인의 소셜 미디어(SNS) 채널에 배경음악으로 매칭하여 업로드하고 이에 따른 정당한 경제적 리워드를 정산받는 테크 기반의 음악 마케팅 플랫폼입니다.</p>
        </div>

        {/* 2. 체험단 유형 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-3">2. 체험단 유형 및 자격 구분</h2>
          <div className="bg-blue-50 rounded-lg p-3 mb-2">
            <p className="text-sm font-medium text-blue-800">일반 체험단</p>
            <p className="text-sm text-gray-600 mt-1">미션 음원을 본인 소셜 미디어 게시물의 배경음악으로 깔고 일상적인 영상 또는 사진과 함께 업로드하는 크리에이터입니다.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-800">커버 체험단</p>
            <p className="text-sm text-gray-600 mt-1">게시물 업로드를 포함하여 미션 음원을 본인의 목소리로 직접 가창하는 영상으로 촬영하여 업로드할 수 있는 전문 음악 관여층 크리에이터입니다.</p>
          </div>
        </div>

        {/* 3. 미션 참여 절차 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-3">3. 미션 참여 및 게시 절차</h2>
          <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-600 text-center font-medium">
            [1단계] 알림 수령 → [2단계] 참여 클릭 → [3단계] SNS 업로드 → [4단계] 링크 제출
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">① 미션 참여</p>
              <p className="text-sm text-gray-600 mt-1">음원 캠페인이 오픈되면 참여알림 푸시가 발송됩니다. 앱에 접속하여 해당 캠페인의 [참여] 버튼을 누르면 즉시 미션이 배정되며 모집인원에 따라 마감됩니다. (알림 설정 반드시 해주셔야합니다)</p>
            </div>
            <div>
              <p className="text-sm font-medium">② 콘텐츠 제작 및 게시</p>
              <p className="text-sm text-gray-600 mt-1">더블비뮤직 앱에 연동 등록해 두신 본인의 SNS 계정(인스타그램, 유튜브, 틱톡 등) 1곳 이상에 일상적인 사진이나 영상물과 함께 미션 곡을 배경음악으로 선택하여 업로드 하면 됩니다.</p>
              <div className="bg-orange-50 rounded-lg p-2 mt-2">
                <p className="text-xs text-orange-700 font-medium">⚠️ 게시글 설명에 필히 표기:</p>
                <p className="text-xs text-orange-600">"더블비뮤직 체험단 선정, 협찬으로 올려요"</p>
                <p className="text-xs text-orange-600 mt-1">인스타그램의 경우 사진일지라도 반드시 '릴스'로 업로드 해주세요.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">③ 미션 완료 인증</p>
              <p className="text-sm text-gray-600 mt-1">SNS 채널에 업로드가 완료되면 해당 게시글의 링크를 복사하여 더블비뮤직 앱 내 미션제출하기란에 붙여넣고 제출을 완료하면 검수 봇이 자동 매칭 분석을 시작합니다.</p>
            </div>
          </div>
        </div>

        {/* 4. 리워드 및 레벨 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-3">4. 리워드 적립 및 레벨 시스템</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">적립 구조</p>
              <p className="text-sm text-gray-600 mt-1">제출된 링크의 협찬표기 무결성이 확인되면, 게시물 1개당 본인의 현재 레벨에 매칭되는 정산 금액이 실시간으로 차등 적립됩니다. 누적자산은 앱 내 적립금 창을 통해 투명하게 상시 확인할 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium">레벨 성장 규칙</p>
              <p className="text-sm text-gray-600 mt-1">크리에이터의 레벨은 1단계부터 최고 50단계까지 구성되어 있습니다. 본인의 고유 추천인 코드를 통해 신규 가입자가 발생할 때마다 가입자 1명당 크리에이터의 레벨이 정확히 1단계씩 즉시 상승합니다.</p>
            </div>
          </div>
        </div>

        {/* 5. 환전 신청 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-3">5. 환전 신청 및 세무 고지</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">신청 기준</p>
              <p className="text-sm text-gray-600 mt-1">앱 내 적립금 총액이 10,000포인트 이상 누적되는 시점부터 크리에이터가 직접 본인 계좌로 현금 환전 신청을 진행할 수 있습니다.</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800">⚠️ 법적 의무 사항</p>
              <p className="text-sm text-gray-600 mt-1">소득세법 및 원천징수 규정에 의거 현금 정산 처리 시 소득세 3.3%가 원천징수되어 국세청에 일괄 세무 신고됩니다. 최초 환전 신청 시 반드시 본인 명의의 주민등록번호와 계좌번호를 등록해 주셔야 합니다.</p>
            </div>
          </div>
        </div>

        {/* Q&A */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 mb-3">💬 자주 묻는 질문 (Q&A)</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Q1. 미션 알림 푸시를 받으면 무조건 참여해야 하나요?',
                a: '아닙니다. 알림 푸시 수령 후 본인이 참여를 원하는 음원과 콘셉트의 캠페인만 선택하여 자율적으로 [참여] 버튼을 누르시면 됩니다. 단, 캠페인별로 선착순 정원이 마감되면 참여가 제한될 수 있습니다.'
              },
              {
                q: 'Q2. SNS에 올릴 영상이나 사진은 꼭 음악과 관련이 있어야 하나요?',
                a: '일반 체험단의 경우 음악과 무관한 본인의 일상, 반려동물, 산책, 방 청소 등 편안한 일상적 영상이나 사진이면 모두 인정됩니다. 중요한 것은 지정된 신곡 음원이 배경음악으로 명확히 매칭되어 숏츠 또는 릴스 게시물로 업로드 되어야 한다는 점입니다.'
              },
              {
                q: 'Q3. 게시물을 올릴 때 본문에 꼭 적어야 하는 문구가 있나요?',
                a: '대한민국 표시광고법(뒷광고 제재) 지침 준수를 위해, 영상 본문 맨 첫 줄에 "더블비뮤직 체험단 선정, 협찬으로 올려요"라는 문구를 기재하셔야 합니다. 해당 문구가 누락되거나 숨겨져 있을 경우 미션이 자동으로 반려 처리됩니다.'
              },
              {
                q: 'Q4. 친구를 내 추천인 코드로 가입시키면 어떤 이득이 있나요?',
                a: '친구가 회원가입 시 회원님의 추천인 코드를 입력하면 크리에이터 등급 레벨이 즉시 1단계 상승합니다. 레벨이 상승하면 향후 참여하는 모든 신곡 캠페인의 게시물당 정산 단가가 상향됩니다. 단, 회원가입만 하고 활동이 없는 경우 통보 후 등급 하향 조절됩니다.'
              },
              {
                q: 'Q5. 환전 신청을 하려는데 왜 주민등록번호를 입력하라고 하나요? 안전한가요?',
                a: '포인트가 아닌 현금을 개인 통장으로 정산해 드리는 절차는 소득세법상 프리랜서 용역 계약에 해당하므로, 국가에 3.3% 세금 신고를 대행하기 위해 주민등록번호 수집이 법적 필수 요건입니다. 입력하신 주민번호는 AES-256 암호화로 강력 격리 보관되며, 국세청 신고 외의 용도로는 절대 유출되지 않습니다.'
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-3">
                <p className="text-sm font-medium text-gray-800">{item.q}</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500 font-medium mb-2">더블비뮤직 · 대표: 최병민 · 사업자등록번호: 280-02-02331</p>
          <p className="text-xs text-gray-400 mb-1">서울특별시 송파구 백제고분로 116, 3층 611호</p>
          <p className="text-xs text-gray-400 mb-3">고객센터: 010-7593-7966</p>
          <p className="text-xs text-gray-300">COPYRIGHT 2026. 더블비뮤직 ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  )
}
