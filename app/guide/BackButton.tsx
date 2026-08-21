'use client'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    // 새 탭으로 열린 경우: 탭 닫기 시도, 실패하면 홈페이지로 이동
    window.close()
    setTimeout(() => {
      window.location.href = 'https://doubleb.kr/%EC%B2%B4%ED%97%98%EB%8B%A8-%EC%8B%A0%EC%B2%AD'
    }, 100)
  }
  return (
    <button onClick={handleClick} className="text-gray-500 text-xl">←</button>
  )
}
