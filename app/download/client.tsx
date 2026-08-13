'use client'

import { useEffect } from 'react'

const AppStoreIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <circle cx="16" cy="16" r="14" fill="url(#paint0_linear_87_8317)"/>
    <path d="M18.4468 8.65403C18.7494 8.12586 18.5685 7.45126 18.0428 7.14727C17.5171 6.84328 16.8456 7.02502 16.543 7.55318L16.0153 8.47442L15.4875 7.55318C15.1849 7.02502 14.5134 6.84328 13.9877 7.14727C13.462 7.45126 13.2811 8.12586 13.5837 8.65403L14.748 10.6864L11.0652 17.1149H8.09831C7.49173 17.1149 7 17.6089 7 18.2183C7 18.8277 7.49173 19.3217 8.09831 19.3217H18.4324C18.523 19.0825 18.6184 18.6721 18.5169 18.2949C18.3644 17.7279 17.8 17.1149 16.8542 17.1149H13.5997L18.4468 8.65403Z" fill="white"/>
    <path d="M11.6364 20.5419C11.449 20.3328 11.0292 19.9987 10.661 19.8888C10.0997 19.7211 9.67413 19.8263 9.45942 19.9179L8.64132 21.346C8.33874 21.8741 8.51963 22.5487 9.04535 22.8527C9.57107 23.1567 10.2425 22.975 10.5451 22.4468L11.6364 20.5419Z" fill="white"/>
    <path d="M22.2295 19.3217H23.9017C24.5083 19.3217 25 18.8277 25 18.2183C25 17.6089 24.5083 17.1149 23.9017 17.1149H20.9653L17.6575 11.3411C17.4118 11.5757 16.9407 12.175 16.8695 12.8545C16.778 13.728 16.9152 14.4636 17.3271 15.1839C18.7118 17.6056 20.0987 20.0262 21.4854 22.4468C21.788 22.975 22.4594 23.1567 22.9852 22.8527C23.5109 22.5487 23.6918 21.8741 23.3892 21.346L22.2295 19.3217Z" fill="white"/>
    <defs>
      <linearGradient id="paint0_linear_87_8317" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2AC9FA"/>
        <stop offset="1" stopColor="#1F65EB"/>
      </linearGradient>
    </defs>
  </svg>
)

const PlayStoreIcon = () => (
  <svg height="24px" width="24px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <g>
      <path style={{fill:'#3A9BC8'}} d="M225.656,256.052L14.016,485.451l-6.442,7.052c-4.005-5.919-6.704-12.972-7.313-20.806C0.087,470.305,0,468.91,0,467.518V44.499c0-9.488,2.873-18.02,7.574-24.987L225.656,256.052z"/>
      <path style={{fill:'#9BCD83'}} d="M320.811,152.8l-95.155,103.253L7.574,19.512C19.936,1.405,45.183-6.342,66.6,6.02L320.811,152.8z"/>
      <path style={{fill:'#EEB84C'}} d="M455.056,257.27c-0.348,14.453-7.748,28.904-22.113,37.174l-112.132,64.771l-95.155-103.163L320.811,152.8l70.518,40.745l41.614,24.026C448.178,226.366,455.579,241.861,455.056,257.27z"/>
      <path style={{fill:'#B43F70'}} d="M7.591,492.492c12.368,18.116,37.599,25.838,58.976,13.496L320.775,359.22l-95.156-103.209L7.591,492.492z"/>
    </g>
  </svg>
)

export default function DownloadClient() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) localStorage.setItem('referralCode', ref)
    const src = params.get('src')
    if (src) {
      localStorage.setItem('downloadSource', src)
      fetch('/api/download-links/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_name: src }) })
    }
    
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    if (isIOS) {
      if (src) fetch('/api/download-links/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_name: src, platform: 'ios' }) })
      window.location.replace('https://apps.apple.com/kr/app/id6787446365')
    } else if (isAndroid) {
      if (src) fetch('/api/download-links/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_name: src, platform: 'android' }) })
      window.location.replace('https://play.google.com/store/apps/details?id=com.dbmusic.viral')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">더블비뮤직</h1>
      <p className="text-gray-500 mb-8 text-sm">앱을 다운로드해주세요</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a href="https://apps.apple.com/kr/app/id6787446365" target="_blank" rel="noopener noreferrer" onClick={() => { const src = new URLSearchParams(window.location.search).get('src'); if (src) fetch('/api/download-links/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_name: src, platform: 'ios' }) }) }} className="bg-black text-white rounded-xl py-4 text-center font-medium flex items-center justify-center gap-2">
          <AppStoreIcon /> App Store (iOS)
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.dbmusic.viral" onClick={() => { const src = new URLSearchParams(window.location.search).get('src'); if (src) fetch('/api/download-links/click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source_name: src, platform: 'android' }) }) }} className="bg-green-600 text-white rounded-xl py-4 text-center font-medium flex items-center justify-center gap-2">
          <PlayStoreIcon /> Google Play (Android)
        </a>
      </div>
      <p className="text-xs text-gray-400 mt-6 text-center">iOS에서 앱스토어가 열리지 않으면<br/>Safari 브라우저에서 접속해주세요.</p>
    </div>
  )
}
