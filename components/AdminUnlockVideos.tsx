'use client'
import { LockOpen } from 'lucide-react'
import PlatformIcon from './PlatformIcon'

type Props = {
  unlockVideos: any[]
  newUnlockUrl: string
  setNewUnlockUrl: (url: string) => void
  onAdd: () => void
  onDelete: (id: number) => void
}

export default function AdminUnlockVideos({ unlockVideos, newUnlockUrl, setNewUnlockUrl, onAdd, onDelete }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <h2 className="font-bold mb-3 dark:text-white flex items-center gap-1"><LockOpen size={16} /> 락 해제 영상 관리</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={newUnlockUrl} onChange={(e) => setNewUnlockUrl(e.target.value)} className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" placeholder="유튜브 URL 입력" />
          <button onClick={onAdd} className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">추가</button>
        </div>
        {unlockVideos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">등록된 영상이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {unlockVideos.map((v) => (
              <div key={v.id} className="flex justify-between items-center border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700">
                <a href={v.video_url} target="_blank" className="text-xs text-blue-500 truncate flex-1 flex items-center gap-1"><PlatformIcon platform="youtube" size={12} /> {v.video_url}</a>
                <button onClick={() => onDelete(v.id)} className="text-xs text-red-500 ml-2">삭제</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
