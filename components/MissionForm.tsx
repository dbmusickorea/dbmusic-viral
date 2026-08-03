'use client'
import { useParticipant } from '../contexts/ParticipantContext'

export default function MissionForm({ selectedParticipation }: { selectedParticipation: any }) {
  const {
    projectInfo, requirements, participantCount, bannedUntil, isJoined,
    influencerName, setInfluencerName, platform, setPlatform, snsAccount, setSnsAccount,
    postUrls, setPostUrls, isSubmitting, isCover, setIsCover, projectCode, setProjectCode,
    coverUrl, setCoverUrl, isSubmittingCover, setIsSubmittingCover, myPosts,
    coverRequests, showCommentMission, setShowCommentMission, projectLinks,
    commentMissions, selectedVideoIndex, setSelectedVideoIndex, videoWatched, setVideoWatched,
    youtubeHandle, setYoutubeHandle, isVerifying, showToast,
    handleJoin, handleSubmit, handleCommentVerify,
  } = useParticipant()

  if (selectedParticipation.projects?.status !== 'ONGOING' || selectedParticipation.status === 'CANCELLED') return null

  return (
    <div className="mt-3">
      <div className="space-y-3">
        {projectInfo && (requirements || projectInfo?.required_posts > 1) && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800">📋 의뢰인 요청사항</p>
            {requirements && <p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">{requirements}</p>}
            {projectInfo?.required_posts > 1 && <p className="text-sm font-medium text-blue-800 mt-1">📝 요청 게시물 수: {projectInfo.required_posts}개</p>}
          </div>
        )}
        {projectInfo && (
          <div className="bg-gray-50 rounded-lg p-3">
            {projectInfo.start_date && <p className="text-sm text-gray-700">📅 미션일: {projectInfo.start_date}</p>}
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">참여인원: {participantCount}/{projectInfo.max_participants || '∞'}{projectInfo.cover_video_count > 0 ? ` + 커버 ${projectInfo.cover_current ?? 0}/${projectInfo.cover_video_count}` : ''}</p>
              {bannedUntil ? (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">활동제한</span>
              ) : isJoined ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">참여중 ✅</span>
              ) : projectInfo.max_participants > 0 && participantCount >= projectInfo.max_participants ? (
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">모집 예정</span>
              ) : (
                <button onClick={handleJoin} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">참여하기</button>
              )}
            </div>
          </div>
        )}
        {projectInfo && isJoined && (!projectInfo.mission_date || new Date().toISOString().split('T')[0] >= projectInfo.mission_date) && (
          <>
            <div>
              <label className="text-sm font-medium">참여자 이름</label>
              <input value={influencerName} onChange={(e) => setInfluencerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="이름 입력" />
            </div>
            <div>
              <label className="text-sm font-medium">플랫폼 선택</label>
              <select value={platform} onChange={(e) => {
                setPlatform(e.target.value)
                const accounts = JSON.parse(localStorage.getItem('snsAccounts') || '{}')
                if (e.target.value === 'instagram') setSnsAccount(accounts.instagram ?? '')
                else if (e.target.value === 'youtube') setSnsAccount(accounts.youtube ?? '')
                else if (e.target.value === 'tiktok') setSnsAccount(accounts.tiktok ?? '')
                else setSnsAccount('')
              }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                <option value="">플랫폼을 선택해주세요</option>
                <option value="instagram">인스타그램</option>
                <option value="youtube">유튜브</option>
                <option value="tiktok">틱톡</option>
              </select>
              {platform === 'instagram' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-orange-700 font-medium">⚠️ 인스타그램은 반드시 <strong>릴스(Reels)</strong>로 올려주세요.</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">본인 SNS 계정</label>
              <input value={snsAccount} onChange={(e) => setSnsAccount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="SNS 아이디" />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-orange-700 font-medium">⚠️ 필수 문구 안내</p>
              <p className="text-xs text-orange-600 mt-1">'더블비뮤직 체험단 선정, 협찬으로 올려요' 라는 문구를 반드시 기재하셔야 합니다. 해당 문구가 누락되거나 숨겨져 있을 경우 미션이 자동으로 반려 처리됩니다.</p>
            </div>
            <div>
              {(() => {
                const normalPosts = myPosts.filter((p: any) => p.project_code?.toLowerCase() === selectedParticipation?.project_code?.toLowerCase() && !p.is_cover)
                const maxNormal = projectInfo?.required_posts ?? 1
                return maxNormal > 0 && (
                  <>
                    <label className="text-sm font-medium">일반 게시물 링크</label>
                    {normalPosts.length > 0 ? (
                      <>
                        <p className="text-xs text-green-600 mt-1">✅ {normalPosts.length}차 게시물 제출 완료</p>
                        {projectInfo?.required_posts > 1 && normalPosts.length < maxNormal && (() => {
                          const secondPostDateTime = projectInfo?.second_post_date && projectInfo?.second_post_time
                            ? new Date(`${projectInfo.second_post_date}T${projectInfo.second_post_time}:00`)
                            : null
                          const canSubmitSecond = secondPostDateTime && new Date() >= secondPostDateTime
                          return canSubmitSecond ? (
                            <>
                              <input value={postUrls[0] ?? ''} onChange={(e) => { const newUrls = [...postUrls]; newUrls[0] = e.target.value; setPostUrls(newUrls) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-2" placeholder="2차 게시글 주소 입력" />
                              <button onClick={() => { setIsCover(false); handleSubmit() }} disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium mt-2 disabled:bg-gray-400">
                                {isSubmitting ? '제출 중...' : '2차 게시물 제출'}
                              </button>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">📅 2차 게시물: {projectInfo.second_post_date} {projectInfo.second_post_time} 이후 업로드 가능</p>
                          )
                        })()}
                      </>
                    ) : (
                      <>
                        <input value={postUrls[0] ?? ''} onChange={(e) => { const newUrls = [...postUrls]; newUrls[0] = e.target.value; setPostUrls(newUrls) }} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="게시글 주소 입력" />
                        <button onClick={() => { setIsCover(false); handleSubmit() }} disabled={isSubmitting} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium mt-2 disabled:bg-gray-400">
                          {isSubmitting ? '제출 중...' : '일반 게시물 제출'}
                        </button>
                      </>
                    )}
                  </>
                )
              })()}
              {selectedParticipation?.is_cover && projectInfo?.cover_video_count > 0 && coverRequests.find((r: any) => r.project_code?.toLowerCase() === selectedParticipation?.project_code?.toLowerCase())?.status === 'APPROVED' && (() => {
                const coverPost = myPosts.find((p: any) => p.project_code?.toLowerCase() === selectedParticipation?.project_code?.toLowerCase() && p.is_cover)
                return (
                  <div className="mt-3 pt-3 border-t">
                    <label className="text-sm font-medium text-purple-700">🎵 커버 게시물 링크 (7일 내)</label>
                    {coverPost ? (
                      <p className="text-xs text-green-600 mt-1">✅ 커버 게시물 제출 완료</p>
                    ) : (
                      <>
                        <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="커버영상 링크 입력" />
                        <button onClick={async () => {
                          if (!coverUrl) { showToast('커버영상 링크를 입력해주세요.'); return }
                          setIsSubmittingCover(true)
                          setIsCover(true)
                          setProjectCode(selectedParticipation?.project_code ?? '')
                          const savedUrl = postUrls[0]
                          setPostUrls([coverUrl])
                          await handleSubmit(selectedParticipation?.project_code, [coverUrl], true)
                          setPostUrls([savedUrl ?? ''])
                          setCoverUrl('')
                          setIsCover(false)
                          setIsSubmittingCover(false)
                        }} disabled={isSubmittingCover} className="w-full bg-purple-600 text-white rounded-lg py-2 font-medium mt-2 disabled:bg-gray-400">
                          {isSubmittingCover ? '제출 중...' : '커버 게시물 제출'}
                        </button>
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
          </>
        )}
        {projectLinks.length > 0 && (
          <button onClick={() => setShowCommentMission(!showCommentMission)} className="w-full mt-2 border border-orange-400 text-orange-500 rounded-lg py-2 text-sm font-medium">
            {showCommentMission ? '댓글 미션 닫기 ▲' : '💬 댓글 미션 하러가기 ▼'}
          </button>
        )}
        {showCommentMission && projectLinks.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <h2 className="font-bold mb-3">💬 댓글 미션</h2>
              <p className="text-xs text-gray-500 mb-3">영상을 시청하고 댓글을 작성한 후 계정명을 입력해서 300P를 받으세요!</p>
              <p className="text-xs text-red-400 mb-3">⚠️ 댓글 삭제 시 적립금이 차감됩니다.</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  {projectLinks.filter((link: any) => ['youtube_shorts', 'youtube_long', 'youtube_lyric', 'playlist'].includes(link.platform)).map((link: any, i: any) => {
                    const isDone = commentMissions.some((m: any) => m.video_id === link.video_id)
                    const sameplatformLinks = projectLinks.filter((l: any) => l.platform === link.platform)
                    const platformIndex = sameplatformLinks.findIndex((l: any) => l === link) + 1
                    const showNumber = sameplatformLinks.length > 1
                    const platformName =
                      link.platform === 'youtube_shorts' ? '숏츠 영상' :
                      link.platform === 'youtube_long' ? '유튜브 영상' :
                      link.platform === 'youtube_lyric' ? '리릭영상' : '플레이리스트'
                    const platformLabel = showNumber ? `${platformName} ${platformIndex} 보러가기` : `${platformName} 보러가기`
                    return (
                      <button key={i} onClick={() => {
                        setSelectedVideoIndex(i + 1)
                        setVideoWatched(false)
                        window.open(link.url, '_blank')
                        setTimeout(() => { setVideoWatched(true) }, 30000)
                      }} className={`w-full rounded-lg py-2 font-medium text-sm flex items-center px-3 ${selectedVideoIndex === i + 1 ? 'bg-red-600 text-white' : 'border border-red-600 text-red-600'}`}>
                        <span className="w-5 flex items-center">
                          {isDone ? '✅' : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                        </span>
                        <span className="flex-1 text-center">{platformLabel}</span>
                        <span className="w-5"></span>
                      </button>
                    )
                  })}
                </div>
                {selectedVideoIndex && !videoWatched && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 text-center">⏱ 30초 이상 시청하셔야 인증창이 활성화 됩니다. 시청 후 댓글을 작성하고 돌아오세요!</p>
                  </div>
                )}
                {selectedVideoIndex && videoWatched && (
                  <p className="text-xs text-green-600 text-center font-medium">✅ 시청 완료! 아래에서 인증해주세요.</p>
                )}
                <div>
                  <label className="text-sm font-medium">유튜브 계정명</label>
                  <input value={youtubeHandle} onChange={(e) => setYoutubeHandle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="@계정명 또는 닉네임" />
                </div>
                <button onClick={async () => {
                  if (!videoWatched) { showToast('먼저 영상을 시청해주세요!'); return }
                  if (!projectLinks.length) { showToast('등록된 영상이 없어요.'); return }
                  const selectedLink = projectLinks[selectedVideoIndex! - 1]
                  const videoId = selectedLink?.video_id
                  if (videoId) await handleCommentVerify(videoId, projectCode)
                  else showToast('등록된 영상이 없어요.')
                }} disabled={isVerifying || !videoWatched} className="w-full bg-orange-500 text-white rounded-lg py-2 font-medium disabled:bg-gray-400">
                  {isVerifying ? '인증 중...' : !videoWatched ? '영상 시청 후 인증 가능' : '댓글 인증 및 보상 받기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
