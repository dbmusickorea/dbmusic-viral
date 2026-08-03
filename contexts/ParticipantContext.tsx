'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '../components/ToastContext'

const ParticipantContext = createContext<any>(null)

export function useParticipant() {
  return useContext(ParticipantContext)
}

export function ParticipantProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { showToast } = useToast()

  const [projectVideos, setProjectVideos] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [requirements, setRequirements] = useState('')
  const [projectStatus, setProjectStatus] = useState('')
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [influencerName, setInfluencerName] = useState('')
  const [commentMissions, setCommentMissions] = useState<any[]>([])
  const [youtubeHandle, setYoutubeHandle] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [snsAccount, setSnsAccount] = useState('')
  const [postUrls, setPostUrls] = useState<string[]>([''])
  const [platform, setPlatform] = useState('')
  const [address, setAddress] = useState('')
  const [showMyInfo, setShowMyInfo] = useState(false)
  const [myName, setMyName] = useState('')
  const [myMobile, setMyMobile] = useState('')
  const [myBankName, setMyBankName] = useState('')
  const [myAccountHolder, setMyAccountHolder] = useState('')
  const [myAccountNumber, setMyAccountNumber] = useState('')
  const [myInstagram, setMyInstagram] = useState('')
  const [myYoutube, setMyYoutube] = useState('')
  const [myTiktok, setMyTiktok] = useState('')
  const [myPassword, setMyPassword] = useState('')
  const [balance, setBalance] = useState(0)
  const [level, setLevel] = useState(1)
  const [referralCode, setReferralCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [mySettlements, setMySettlements] = useState<any[]>([])
  const [projectsMap, setProjectsMap] = useState<any>({})
  const [showPosts, setShowPosts] = useState(false)
  const [postFilter, setPostFilter] = useState<'current' | 'all'>('current')
  const [isJoined, setIsJoined] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [myParticipations, setMyParticipations] = useState<any[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [bannedUntil, setBannedUntil] = useState<string | null>(null)
  const [banReason, setBanReason] = useState<string | null>(null)
  const [coverPenaltyUntil, setCoverPenaltyUntil] = useState<string | null>(null)
  const [coverPenaltyReason, setCoverPenaltyReason] = useState<string | null>(null)
  const [unlockVideos, setUnlockVideos] = useState<any[]>([])
  const [unlockCommentCount, setUnlockCommentCount] = useState(0)
  const [showLevelGuide, setShowLevelGuide] = useState(false)
  const [myCurrentPassword, setMyCurrentPassword] = useState('')
  const [videoWatched, setVideoWatched] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [showPlayer, setShowPlayer] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isCover, setIsCover] = useState(false)
  const [myRankMap, setMyRankMap] = useState<{[key: string]: any}>({})
  const [coverReward, setCoverReward] = useState<number>(0)
  const [isPulling, setIsPulling] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [participationPage, setParticipationPage] = useState(0)
  const [projectListPage, setProjectListPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'home' | 'project'>('home')
  const [myPostPage, setMyPostPage] = useState(0)
  const [projectLinks, setProjectLinks] = useState<any[]>([])
  const [coverRequests, setCoverRequests] = useState<any[]>([])
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null)
  const [participationFilter, setParticipationFilter] = useState<'current' | 'all'>('current')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCommentMission, setShowCommentMission] = useState(false)
  const [isCoverPossible, setIsCoverPossible] = useState(false)
  const [showParticipation, setShowParticipation] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [isCoverApproved, setIsCoverApproved] = useState(false)
  const [joinAsCover, setJoinAsCover] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [isSubmittingCover, setIsSubmittingCover] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [activeIsCover, setActiveIsCover] = useState(false)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)

  const PAGE_SIZE = 5

  return (
    <ParticipantContext.Provider value={{
      projectVideos, setProjectVideos,
      userInfo, setUserInfo,
      userRole, setUserRole,
      projectCode, setProjectCode,
      requirements, setRequirements,
      projectStatus, setProjectStatus,
      projectInfo, setProjectInfo,
      influencerName, setInfluencerName,
      commentMissions, setCommentMissions,
      youtubeHandle, setYoutubeHandle,
      isVerifying, setIsVerifying,
      selectedVideoId, setSelectedVideoId,
      snsAccount, setSnsAccount,
      postUrls, setPostUrls,
      platform, setPlatform,
      address, setAddress,
      showMyInfo, setShowMyInfo,
      myName, setMyName,
      myMobile, setMyMobile,
      myBankName, setMyBankName,
      myAccountHolder, setMyAccountHolder,
      myAccountNumber, setMyAccountNumber,
      myInstagram, setMyInstagram,
      myYoutube, setMyYoutube,
      myTiktok, setMyTiktok,
      myPassword, setMyPassword,
      balance, setBalance,
      level, setLevel,
      referralCode, setReferralCode,
      isSubmitting, setIsSubmitting,
      isDeletingPost, setIsDeletingPost,
      myPosts, setMyPosts,
      mySettlements, setMySettlements,
      projectsMap, setProjectsMap,
      showPosts, setShowPosts,
      postFilter, setPostFilter,
      isJoined, setIsJoined,
      participantCount, setParticipantCount,
      allProjects, setAllProjects,
      myParticipations, setMyParticipations,
      isLocked, setIsLocked,
      bannedUntil, setBannedUntil,
      banReason, setBanReason,
      coverPenaltyUntil, setCoverPenaltyUntil,
      coverPenaltyReason, setCoverPenaltyReason,
      unlockVideos, setUnlockVideos,
      unlockCommentCount, setUnlockCommentCount,
      showLevelGuide, setShowLevelGuide,
      myCurrentPassword, setMyCurrentPassword,
      videoWatched, setVideoWatched,
      watchProgress, setWatchProgress,
      showPlayer, setShowPlayer,
      showCurrentPassword, setShowCurrentPassword,
      showNewPassword, setShowNewPassword,
      selectedVideoIndex, setSelectedVideoIndex,
      availableBalance, setAvailableBalance,
      showNotifications, setShowNotifications,
      notifications, setNotifications,
      unreadCount, setUnreadCount,
      isCover, setIsCover,
      myRankMap, setMyRankMap,
      coverReward, setCoverReward,
      isPulling, setIsPulling,
      pullStartY, setPullStartY,
      isRefreshing, setIsRefreshing,
      participationPage, setParticipationPage,
      projectListPage, setProjectListPage,
      activeTab, setActiveTab,
      myPostPage, setMyPostPage,
      projectLinks, setProjectLinks,
      coverRequests, setCoverRequests,
      selectedParticipation, setSelectedParticipation,
      participationFilter, setParticipationFilter,
      deleteConfirmText, setDeleteConfirmText,
      showDeleteConfirm, setShowDeleteConfirm,
      showSidebar, setShowSidebar,
      showCommentMission, setShowCommentMission,
      isCoverPossible, setIsCoverPossible,
      showParticipation, setShowParticipation,
      showGuide, setShowGuide,
      guideStep, setGuideStep,
      isCoverApproved, setIsCoverApproved,
      joinAsCover, setJoinAsCover,
      coverUrl, setCoverUrl,
      isSubmittingCover, setIsSubmittingCover,
      showTutorial, setShowTutorial,
      activeIsCover, setActiveIsCover,
      coverImageFile, setCoverImageFile,
      PAGE_SIZE,
      showToast,
      router,
    }}>
      {children}
    </ParticipantContext.Provider>
  )
}
