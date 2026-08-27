import { Capacitor } from '@capacitor/core'

declare global {
  interface Window {
    FB?: any
  }
}

export function logFBEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (Capacitor.isNativePlatform()) {
      // 네이티브 앱에서는 SDK가 자동으로 처리
      console.log(`[FB Event] ${eventName}`, params)
    }
  } catch (e) {
    console.error('FB Event error:', e)
  }
}

// 체험단 가입 완료
export function logCompleteRegistration(method: string = 'email') {
  logFBEvent('CompleteRegistration', { registration_method: method })
}

// 콘텐츠 조회
export function logViewContent(contentId: string, contentType: string) {
  logFBEvent('ViewContent', { content_id: contentId, content_type: contentType })
}

// 업적 달성 (리워드 지급)
export function logAchievementUnlocked(description: string) {
  logFBEvent('AchievementUnlocked', { description })
}
