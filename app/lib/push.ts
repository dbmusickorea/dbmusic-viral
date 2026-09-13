import { PushNotifications } from '@capacitor/push-notifications'
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings'
import { Capacitor } from '@capacitor/core'

let currentUserId = ''
let currentUserRole = ''
let listenersRegistered = false

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
    currentUserId = userId
    currentUserRole = userRole

    // 리스너를 먼저 등록해야, register()가 아주 빨리 응답하는 기기에서도
    // registration 이벤트를 놓치지 않는다
    if (!listenersRegistered) {
      listenersRegistered = true

      PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token:', token.value)
        await fetch('/api/push_tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUserId,
            user_role: currentUserRole,
            token: token.value
          })
        })
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('알림 수신:', notification)
        alert(`${notification.title}\n${notification.body}`)
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data
        const urlStr = data?.url || data?.data?.url
        if (urlStr) {
          const url = new URL(urlStr, window.location.origin)
          const tab = url.searchParams.get('tab')
          if (tab) {
            if (url.pathname === '/participant') sessionStorage.setItem('participantTab', tab)
            else if (url.pathname === '/client') sessionStorage.setItem('clientTab', tab)
          }
          if (url.searchParams.get('open_chat') === '1') {
            sessionStorage.setItem('openAdminChat', '1')
          }
          window.location.href = url.pathname
        } else if (data?.page || data?.data?.page) {
          window.location.href = data?.page || data?.data?.page
        }
      })
    }

    const permission = await PushNotifications.requestPermissions()

    if (permission.receive !== 'granted') {
      console.log('푸시 알림 권한 거부됨')
      return
    }

    await PushNotifications.register()
  } catch (error) {
    console.log('푸시 알림 초기화 실패:', error)
  }
}


// 기기 알림 권한 상태 확인 ('granted' | 'denied' | 'prompt')
export const checkPushPermission = async (): Promise<string> => {
  try {
    const status = await PushNotifications.checkPermissions()
    return status.receive
  } catch {
    return 'denied'
  }
}

// 권한 요청 시도. 이미 거부된 상태(재요청 불가)라면 기기 설정의 앱 알림 화면으로 이동
export const requestPushPermissionOrOpenSettings = async (): Promise<string> => {
  try {
    const before = await PushNotifications.checkPermissions()
    if (before.receive === 'granted') return 'granted'

    if (before.receive === 'prompt' || before.receive === 'prompt-with-rationale') {
      const after = await PushNotifications.requestPermissions()
      if (after.receive === 'granted') {
        await PushNotifications.register()
        return 'granted'
      }
      return after.receive
    }

    // 이미 거부됐던 경우 -> OS 재요청 다이얼로그가 뜨지 않으므로 설정 화면으로 이동
    await NativeSettings.open({ optionIOS: IOSSettings.App, optionAndroid: AndroidSettings.AppNotification })
    return before.receive
  } catch (error) {
    console.log('권한 요청/설정 이동 실패:', error)
    return 'denied'
  }
}
