import { Capacitor } from '@capacitor/core'
import { FacebookLogin } from '@capacitor-community/facebook-login'

export async function logFBEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (Capacitor.isNativePlatform()) {
      await FacebookLogin.logEvent({ eventName: eventName, parameters: (params ?? {}) as Record<string, string | number> })
    } else {
      console.log(`[FB Event] ${eventName}`, params)
    }
  } catch (e) {
    console.error('FB Event error:', e)
  }
}

// 체험단 가입 완료
export async function logCompleteRegistration(method: string = 'email') {
  await logFBEvent('fb_mobile_complete_registration', { fb_registration_method: method })
}

// 콘텐츠 조회
export async function logViewContent(contentId: string, contentType: string) {
  await logFBEvent('fb_mobile_content_view', { fb_content_id: contentId, fb_content_type: contentType })
}

// 업적 달성 (리워드 지급)
export async function logAchievementUnlocked(description: string) {
  await logFBEvent('fb_mobile_achievement_unlocked', { fb_description: description })
}
