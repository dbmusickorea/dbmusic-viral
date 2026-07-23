'use client'

import { useRouter } from 'next/navigation'

type Tab = {
  icon: string
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
}

export default function BottomNav({ tabs }: { tabs: Tab[] }) {
  const router = useRouter()

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-50">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => {
              if (tab.onClick) tab.onClick()
              else if (tab.href) router.push(tab.href)
            }}
            className={`flex-1 flex flex-col items-center py-3 text-xs ${tab.active ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <span className="text-lg mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-16 md:hidden" />
    </>
  )
}
