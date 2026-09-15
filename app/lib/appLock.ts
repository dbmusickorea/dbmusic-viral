// 앱 잠금(생체인증/PIN) 관련 핵심 로직
// - 잠금 켜짐 여부/방식은 localStorage에 저장 (민감정보 아님)
// - PIN 값 자체는 네이티브 보안저장소(Keychain/Keystore)에 암호화 저장 (@capgo/capacitor-native-biometric의 setData/getData)
// - 생체인증은 verifyIdentity()로 단순 통과여부만 확인 (자격정보 저장/조회 아님)

const PIN_STORAGE_KEY = 'app_lock_pin'

// 생체인증 진행 중 여부를 앱 전역에서 공유하는 플래그.
// 안드로이드는 생체인증 팝업 자체가 Activity의 진짜 onPause/onResume을 유발하기 때문에,
// AppLockScreen이 인증을 요청하는 동안에는 AppLockGate가 그 재개 신호를 무시하도록
// 이 플래그로 신호를 전달함
export const biometricAuthInProgress = { current: false }

export type LockMethod = 'biometric' | 'pin'

function isNative(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
}

export function getLockSettings(): { enabled: boolean; method: LockMethod | null } {
  if (typeof window === 'undefined') return { enabled: false, method: null }
  const enabled = localStorage.getItem('appLockEnabled') === 'true'
  const method = localStorage.getItem('appLockMethod') as LockMethod | null
  return { enabled, method }
}

export function setLockEnabled(enabled: boolean, method: LockMethod | null) {
  localStorage.setItem('appLockEnabled', enabled ? 'true' : 'false')
  if (method) localStorage.setItem('appLockMethod', method)
  else localStorage.removeItem('appLockMethod')
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const result = await NativeBiometric.isAvailable({ useFallback: false })
    return result.isAvailable
  } catch {
    return false
  }
}

// 'face' | 'fingerprint' | 'other' | null(확인 불가)
export async function getBiometricKind(): Promise<'face' | 'fingerprint' | 'other' | null> {
  if (!isNative()) return null
  try {
    const { NativeBiometric, BiometryType } = await import('@capgo/capacitor-native-biometric')
    const result = await NativeBiometric.isAvailable({ useFallback: false })
    if (result.biometryType === BiometryType.FACE_ID || result.biometryType === BiometryType.FACE_AUTHENTICATION) return 'face'
    if (result.biometryType === BiometryType.TOUCH_ID || result.biometryType === BiometryType.FINGERPRINT) return 'fingerprint'
    if (result.biometryType === BiometryType.NONE) return null
    return 'other'
  } catch {
    return null
  }
}

export async function authenticateBiometric(reason?: string): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    await NativeBiometric.verifyIdentity({
      reason: reason ?? '앱 잠금 해제를 위해 인증해주세요.',
      title: '앱 잠금 해제',
      subtitle: '',
      description: '',
      negativeButtonText: '취소',
      maxAttempts: 5
    })
    return true
  } catch {
    return false
  }
}

export async function setLockPin(pin: string): Promise<void> {
  if (!isNative()) return
  const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
  await NativeBiometric.setData({ key: PIN_STORAGE_KEY, value: pin })
}

export async function verifyLockPin(pin: string): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const stored = await NativeBiometric.getData({ key: PIN_STORAGE_KEY })
    return stored.value === pin
  } catch {
    return false
  }
}

export async function hasLockPin(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const result = await NativeBiometric.isDataSaved({ key: PIN_STORAGE_KEY })
    return result.isSaved
  } catch {
    return false
  }
}

export async function clearLockPin(): Promise<void> {
  if (!isNative()) return
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    await NativeBiometric.deleteData({ key: PIN_STORAGE_KEY })
  } catch {
    // 이미 없으면 무시
  }
}
