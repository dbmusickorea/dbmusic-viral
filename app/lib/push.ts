import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'

export const initPushNotifications = async (userId: string, userRole: string) => {
  // 권한 요청
  const permission = await PushNotifications.requestPermissions()
  
  if (permission.receive !== 'granted') {
    console.log('푸시 알림 권한 거부됨')
    return
  }

  // 푸시 알림 등록
  await PushNotifications.register()

  // FCM 토큰 받기
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value)
    
    // Supabase에 토큰 저장
    await supabase.from('push_tokens').upsert({
      user_id: userId,
      user_role: userRole,
      token: token.value
    }, { onConflict: 'token' })
  })

  // 알림 수신 (앱 열려있을 때)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('알림 수신:', notification)
    alert(`${notification.title}\n${notification.body}`)
  })

  // 알림 클릭
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('알림 클릭:', action)
  })
}