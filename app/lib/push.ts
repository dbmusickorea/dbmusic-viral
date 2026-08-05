import { PushNotifications } from '@capacitor/push-notifications'

let listenersRegistered = false

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
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
            user_id: userId,
            user_role: userRole,
            token: token.value
          })
        })
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('알림 수신:', notification)
        alert(`${notification.title}\n${notification.body}`)
      })

      // 앱 종료 상태에서 푸시 클릭 시 처리
      const launchNotification = await PushNotifications.getDeliveredNotifications()
      alert('delivered: ' + JSON.stringify(launchNotification))

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        alert('알림 클릭: ' + JSON.stringify(action.notification.data))
        const data = action.notification.data
        if (data?.url) {
          const url = new URL(data.url, window.location.origin)
          const tab = url.searchParams.get('tab')
          if (tab) sessionStorage.setItem('activeTab', tab)
          window.location.href = url.pathname
        } else if (data?.page) {
          window.location.href = data.page
        }
      })
    }
  } catch (error) {
    console.log('푸시 알림 초기화 실패:', error)
  }
}