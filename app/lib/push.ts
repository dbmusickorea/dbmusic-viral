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

    PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value)
      // 기존 토큰 삭제 후 새 토큰 등록
      await supabase.from('push_tokens').delete().eq('user_id', userId)
      await supabase.from('push_tokens').insert({
        user_id: userId,
        user_role: userRole,
        token: token.value
      })
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