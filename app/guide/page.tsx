import { Metadata } from 'next'
import BackButton from './BackButton'
import { Bell, ArrowRight } from 'lucide-react'
import PlatformIcon from '../../components/PlatformIcon'

export const metadata: Metadata = {
  title: '더블비뮤직 크리에이터 가이드',
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" style={{wordBreak: "keep-all"}}>
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 mb-4" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold dark:text-white">크리에이터 공식 사용설명서</h1>
          </div>
        </div>

        {/* 1. 서비스 개요 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">1. 서비스 개요</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">더블비뮤직은 발매되는 신곡 음원을 본인의 소셜 미디어(SNS) 채널에 배경음악으로 매칭하여 업로드하고 이에 따른 정당한 경제적 리워드를 정산받는 테크 기반의 음악 마케팅 플랫폼입니다.</p>
        </div>

        {/* 2. 가입 방법 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">2. 가입 방법</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">① 앱 다운로드 및 기본정보 입력</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">더블비뮤직 앱을 다운로드한 후 [체험단 가입]을 선택하여 이름, 이메일, 비밀번호를 입력합니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">② SNS 계정 등록 및 휴대전화 인증</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">본인이 실제로 사용하는 인스타그램, 유튜브, 틱톡 계정 중 1개 이상을 등록한 뒤 휴대전화 본인인증을 진행합니다. 팔로워·구독자가 100명 이상인 계정이어야 하며, 3개 중 1개 이상이 100명을 넘으면 가입이 가능합니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">③ 체험단 유형 선택</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">가입 화면에서 [커버영상 촬영 가능]을 체크하면 커버 체험단으로도 함께 신청할 수 있습니다. 가입 후에도 마이페이지에서 언제든 신청·수정이 가능합니다.</p>
              <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-2 mt-2">
                <p className="text-xs text-orange-700 dark:text-orange-400">커버 체험단은 관리자 승인이 필요하며, 신청 시 본인이 직접 가창한 영상 중 확인 가능한 링크를 반드시 입력해주셔야 합니다.</p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">추천인 코드가 있다면</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">가입 화면에서 추천인 코드를 입력하면, 추천인에게 즉시 150포인트 적립 + 레벨 1단계 상승 혜택이 지급됩니다.</p>
            </div>
          </div>
        </div>

        {/* 3. 체험단 유형 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">3. 체험단 유형 및 자격 구분</h2>
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-2">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">일반 체험단</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">미션 음원을 본인 소셜 미디어 게시물의 배경음악으로 깔고 일상적인 영상 또는 사진과 함께 업로드하는 크리에이터입니다.</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">커버 체험단</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">게시물 업로드를 포함하여 미션 음원을 본인의 목소리로 직접 가창하는 영상으로 촬영하여 업로드할 수 있는 전문 음악 관여층 크리에이터입니다.</p>
          </div>
        </div>

        {/* 3. 미션 참여 절차 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">4. 미션 참여 및 게시 절차</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className="text-[10px] text-gray-400 text-center mb-1">1. 알림 수령</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center gap-1 text-center">
                <Bell size={12} className="text-blue-500" />
                <p className="text-[10px] font-medium leading-tight dark:text-white">새 프로젝트가 기다리고 있어요!</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className="text-[10px] text-gray-400 text-center mb-1">2. 참여 클릭</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center">
                <p className="text-[10px] font-medium mb-1 dark:text-white">가수명 / 곡명</p>
                <div className="bg-blue-600 text-white rounded-md py-1 text-[10px] font-medium">참여하기</div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className="text-[10px] text-gray-400 text-center mb-1">3. SNS 업로드</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 flex flex-col items-center gap-1">
                <div className="flex gap-1.5">
                  <PlatformIcon platform="instagram" size={14} />
                  <PlatformIcon platform="youtube_shorts" size={14} />
                  <PlatformIcon platform="tiktok" size={14} />
                </div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center leading-tight">협찬문구 + 게시물 업로드</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className="text-[10px] text-gray-400 text-center mb-1">4. 링크 제출</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 flex flex-col gap-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded px-1.5 py-1 text-[9px] text-gray-400">게시물 링크 붙여넣기</div>
                <div className="bg-blue-600 text-white rounded-md py-1 text-center text-[10px] font-medium">제출</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">① 알림 수령</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">음원 캠페인이 오픈되면 참여알림 푸시가 발송됩니다. (알림 설정을 반드시 해주셔야 합니다)</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">② 참여 클릭</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">앱에 접속하여 해당 캠페인의 [참여] 버튼을 누르면 즉시 미션이 배정되며, 모집인원에 따라 마감될 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">③ SNS 업로드</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">더블비뮤직 앱에 연동 등록해 두신 본인의 SNS 계정(인스타그램, 유튜브, 틱톡 등) 1곳 이상에 일상적인 사진이나 영상물과 함께 미션 곡을 배경음악으로 선택하여 업로드 하면 됩니다.</p>
              <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-2 mt-2">
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">게시글 설명에 필히 표기:</p>
                <p className="text-xs text-orange-600 dark:text-orange-200">"더블비뮤직 체험단 선정, 협찬으로 올려요"</p>
                <p className="text-xs text-orange-600 dark:text-orange-200 mt-1">인스타그램의 경우 사진일지라도 반드시 '릴스'로 업로드 해주세요.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">④ 링크 제출</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">SNS 채널에 업로드가 완료되면 해당 게시글의 링크를 복사하여 더블비뮤직 앱 내 미션제출하기란에 붙여넣고 제출을 완료하면 검수 봇이 자동 매칭 분석을 시작합니다. 제출이 완료되면 본인의 현재 레벨에 맞는 리워드가 적립됩니다.</p>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mt-2">✓ 커버 옵션이 있는 프로젝트에 한해 커버 체험단으로 선정될 수 있으며, 커버영상이 승인되면 별도의 리워드가 추가 지급됩니다. (모든 프로젝트에 커버 옵션이 있는 것은 아닙니다)</p>
            </div>
          </div>
        </div>

        {/* 4. 리워드 및 레벨 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">5. 리워드 적립 및 레벨 시스템</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">적립 구조</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">제출된 링크의 협찬표기 무결성이 확인되면, 게시물 1개당 본인의 현재 레벨에 매칭되는 정산 금액이 실시간으로 차등 적립됩니다. 누적자산은 앱 내 적립금 창을 통해 투명하게 상시 확인할 수 있습니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium dark:text-white">레벨 성장 규칙</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">크리에이터의 레벨은 1단계부터 최고 50단계까지 구성되어 있습니다. 본인의 고유 추천인 코드를 통해 신규 가입자가 발생할 때마다 가입자 1명당 크리에이터의 레벨이 정확히 1단계씩 즉시 상승합니다.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">레벨별 정산 단가 (게시물 1개당)</p>
              <div className="overflow-hidden rounded-lg border border-purple-200 dark:border-purple-700">
                <table className="w-full text-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <thead className="bg-purple-50 dark:bg-purple-900">
                    <tr>
                      <th className="py-2 px-3 text-left">레벨</th>
                      <th className="py-2 px-3 text-right">적립금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((lv) => (
                      <tr key={lv} className="border-t border-gray-100 dark:border-gray-600">
                        <td className="py-2 px-3">Lv.{lv}</td>
                        <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400 font-medium">
                          {lv === 50 ? '10,000P' : `${(2500 + (lv - 1) * 150).toLocaleString()}P`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 6. 밴 및 페널티 안내 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">6. 활동 제한(밴) 및 페널티 안내</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">건강한 캠페인 운영을 위해 아래와 같은 경우 일시적으로 활동이 제한될 수 있습니다.</p>
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">게시물 미업로드</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">미션 참여 후 48시간 이내에 게시물을 업로드하지 않으면 레벨이 10단계 하락하고 7일간 미션 참여가 제한됩니다. (최저 레벨은 Lv.1, 2,500P이며 그 이하로는 하락하지 않습니다)</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">중간에 게시물을 삭제하더라도 48시간 마감 전에 다시 업로드하면 페널티가 적용되지 않습니다.</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">커버영상 미업로드</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">커버 미션 승인 후 미션 시작일로부터 15일 이내에 커버영상을 업로드하지 않으면 3개월간 커버 미션 참여가 제한됩니다.</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">SNS 게시물 임의 삭제</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">미션 인증 후 SNS에서 게시물을 임의로 삭제한 사실이 확인되면 지급된 적립금이 즉시 회수됩니다. 커버 게시물의 경우 적립금 회수와 함께 3개월간 커버 미션 참여가 추가로 제한됩니다.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-sm font-medium dark:text-white">1개월 이상 미활동 시 계정 잠금</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">가입 후 1개월이 지났음에도 최근 1개월간 활동 내역이 없으면 계정이 잠깁니다. 유튜브 댓글 미션을 10회 작성하여 인증하면 잠금이 자동으로 해제됩니다. 인증이 어려우신 경우 고객센터로 문의해주시면 확인 후 해제해드립니다.</p>
            </div>
          </div>
        </div>

        {/* 7. 환전 신청 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">7. 환전 신청 및 세무 고지</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium dark:text-white">신청 기준</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">앱 내 적립금 총액이 10,000포인트 이상 누적되는 시점부터 크리에이터가 직접 본인 계좌로 현금 환전 신청을 진행할 수 있습니다.</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">법적 의무 사항</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">소득세법 및 원천징수 규정에 의거 현금 정산 처리 시 소득세 3.3%가 원천징수되어 국세청에 일괄 세무 신고됩니다. 최초 환전 신청 시 반드시 본인 명의의 주민등록번호와 계좌번호를 등록해 주셔야 합니다.</p>
            </div>
          </div>
        </div>

        {/* Q&A */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">자주 묻는 질문 (Q&A)</h2>
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
              <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{item.q}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700 mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">더블비뮤직 · 대표: 최병민 · 사업자등록번호: 280-02-02331</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">서울특별시 송파구 백제고분로 116, 3층 611호</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">고객센터: 070-8065-5811</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">COPYRIGHT 2026. 더블비뮤직 ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  )
}
