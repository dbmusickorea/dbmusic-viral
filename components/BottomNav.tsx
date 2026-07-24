'use client'

import { useRouter } from 'next/navigation'

type Tab = {
  icon: string
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
  badge?: number
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
            <div className="relative">
              <span className="text-lg mb-0.5">{tab.icon}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{fontSize: '9px'}}>{tab.badge}</span>
              ) : null}
            </div>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-16 md:hidden" />
    </>
  )
}