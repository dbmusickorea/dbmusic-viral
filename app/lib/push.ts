import { PushNotifications } from '@capacitor/push-notifications'

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
    const permission = await PushNotifications.requestPermissions()
    
    if (permission.receive !== 'granted') {
      console.log('푸시 알림 권한 거부됨')
      return
    }

    await PushNotifications.register()

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

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('알림 클릭:', action)
      const data = action.notification.data
      if (data?.url) {
        window.location.href = data.url
      } else if (data?.page) {
        window.location.href = data.page
      }
    })
  } catch (error) {
    console.log('푸시 알림 초기화 실패:', error)
  }
}