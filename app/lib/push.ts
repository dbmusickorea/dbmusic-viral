import { PushNotifications } from '@capacitor/push-notifications'

let currentUserId = ''
let currentUserRole = ''
let listenersRegistered = false

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
    currentUserId = userId
    currentUserRole = userRole

    const permission = await PushNotifications.requestPermissions()
    
    if (permission.receive !== 'granted') {
      console.log('푸시 알림 권한 거부됨')
      return
    }

    await PushNotifications.register()

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
  } catch (error) {
    console.log('푸시 알림 초기화 실패:', error)
  }
}