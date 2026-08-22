import { registerPlugin } from '@capacitor/core'

interface WidgetDataPlugin {
  saveUserInfo(options: { role: string, id: string }): Promise<void>
  clearUserInfo(): Promise<void>
}

const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData')

export const saveWidgetUserInfo = async (role: string, id: string) => {
  try {
    await WidgetData.saveUserInfo({ role, id })
  } catch {
    // 네이티브 플랫폼이 아니거나 플러그인 미지원 시 무시
  }
}

export const clearWidgetUserInfo = async () => {
  try {
    await WidgetData.clearUserInfo()
  } catch {
    // 무시
  }
}