'use client'

import { useEffect } from 'react'

export default function DownloadClient() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) localStorage.setItem('referralCode', ref)
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      window.location.href = 'https://apps.apple.com/kr/app/id6787446365'
    } else if (/android/.test(userAgent)) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.dbmusic.viral'
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">더블비뮤직</h1>
      <p className="text-gray-500 mb-8 text-sm">앱을 다운로드해주세요</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a href="https://apps.apple.com/kr/app/id6787446365" className="bg-black text-white rounded-xl py-4 text-center font-medium flex items-center justify-center gap-2">
          🍎 App Store (iOS)
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.dbmusic.viral" className="bg-green-600 text-white rounded-xl py-4 text-center font-medium flex items-center justify-center gap-2">
          🤖 Google Play (Android)
        </a>
      </div>
    </div>
  )
}