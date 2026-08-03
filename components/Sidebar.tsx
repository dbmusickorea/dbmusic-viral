'use client'

type SidebarItem = {
  icon: string
  label: string
  onClick: () => void
  active?: boolean
}

type SidebarProps = {
  show: boolean
  onClose: () => void
  items: SidebarItem[]
  onLogout?: () => void
  title?: string
}

export default function Sidebar({ show, onClose, items, onLogout, title = '더블비뮤직' }: SidebarProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="bg-white dark:bg-gray-800 w-64 h-full shadow-xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-300">✕</button>
        </div>
        <div className="space-y-2 flex-1">
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.onClick(); onClose() }} className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium ${item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {item.label}
            </button>
          ))}
        </div>
        {onLogout && (
          <button onClick={onLogout} className="w-full text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg py-2">로그아웃</button>
        )}
      </div>
      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  )
}
