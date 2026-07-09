import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
    const permission = await PushNotifications.requestPermissions()
    
    if (permission.receive !== 'granted') {
      console.log('푸시 알림 권한 거부됨')
      return
    }

    await PushNotifications.register()

    // FCM 토큰 수신 (AppDelegate에서 전달)
    window.addEventListener('FCMToken', async (event: any) => {
      const token = event.detail?.token
      if (token) {
        console.log('FCM Token:', token)
        await supabase.from('push_tokens').upsert({
          user_id: userId,
          user_role: userRole,
          token: token
        }, { onConflict: 'token' })
      }
    })

    PushNotifications.addListener('registration', async (token) => {
      console.log('APN Token:', token.value)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('알림 수신:', notification)
      alert(`${notification.title}\n${notification.body}`)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('알림 클릭:', action)
    })
  } catch (error) {
    console.log('푸시 알림 초기화 실패:', error)
  }
}