import DownloadClient from './client'

export const metadata = {
  title: '더블비뮤직 앱 다운로드',
  description: '더블비뮤직 앱을 다운로드하세요!',
  openGraph: {
    title: '더블비뮤직 앱 다운로드',
    description: '더블비뮤직 앱을 다운로드하세요!',
    images: [{ url: 'https://app.doubleb.kr/og-image.png' }],
  },
}

export default function DownloadPage() {
  return <DownloadClient />
}