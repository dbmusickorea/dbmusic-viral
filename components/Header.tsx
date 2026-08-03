'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

type HeaderProps = {
  href?: string
  onMenuClick?: () => void
}

export default function Header({ href = '/', onMenuClick }: HeaderProps) {
  const router = useRouter()

  return (
    <div className="flex justify-between items-center mb-4">
      <Image
        src="/DBMUSIC_HEADER.svg"
        alt="DBMUSIC"
        width={120}
        height={32}
        className="cursor-pointer dark:invert"
        onClick={() => router.push(href)}
      />
      {onMenuClick && (
        <button onClick={onMenuClick} className="text-gray-600 dark:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
