import { PushNotifications } from '@capacitor/push-notifications'

let currentUserId = ''
let currentUserRole = ''
let listenersRegistered = false

export const initPushNotifications = async (userId: string, userRole: string) => {
  try {
    alert('V2-1: 시작 userId=' + userId + ' listenersRegistered(호출전)=' + listenersRegistered)
    currentUserId = userId
    currentUserRole = userRole

    if (!listenersRegistered) {
      listenersRegistered = true
      alert('V2-2: 리스너 등록 진행함')

      PushNotifications.addListener('registration', async (token) => {
        alert('V2-3: registration 이벤트 도착! 토큰=' + token.value.slice(0, 10))
        console.log('FCM Token:', token.value)
        const res = await fetch('/api/push_tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: currentUserId,
            user_role: currentUserRole,
            token: token.value
          })
        })
        alert('V2-4: 서버 저장 응답 status=' + res.status)
      })

      PushNotifications.addListener('registrationError', (err) => {
        alert('V2-ERROR: registrationError 발생! ' + JSON.stringify(err))
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
    } else {
      alert('V2-2b: 이미 리스너 등록되어 있어서 건너뜀 (이번 세션에서 처음이 아님)')
    }

    const permission = await PushNotifications.requestPermissions()
    alert('V2-5: 권한 결과 = ' + JSON.stringify(permission))

    if (permission.receive !== 'granted') {
      console.log('푸시 알림 권한 거부됨')
      return
    }

    await PushNotifications.register()
    alert('V2-6: register() 완료 (여기까진 항상 옴. 이후 V2-3이 오는지가 핵심)')
  } catch (error) {
    alert('V2-CATCH: 에러 발생! ' + JSON.stringify(error))
    console.log('푸시 알림 초기화 실패:', error)
  }
}
