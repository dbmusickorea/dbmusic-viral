import { registerPlugin } from '@capacitor/core'

interface WidgetDataPlugin {
  saveUserInfo(options: { role: string, id: string }): Promise<void>
  clearUserInfo(): Promise<void>
}

const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData')

export const saveWidgetUserInfo = async (role: string, id: string) => {
  try {
    await WidgetData.saveUserInfo({ role, id })
    alert(`위젯 저장 성공: role=${role}, id=${id}`)
  } catch (e) {
    alert(`위젯 저장 실패: ${JSON.stringify(e)}`)
  }
}

export const clearWidgetUserInfo = async () => {
  try {
    await WidgetData.clearUserInfo()
  } catch {
    // 무시
  }
}