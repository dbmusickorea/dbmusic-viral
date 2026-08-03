'use client'

type Props = {
  projectApplications: any[]
  onApprove: (app: any) => void
  onLoad: (app: any) => void
}

export default function AdminProjectApplications({ projectApplications, onApprove, onLoad }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold dark:text-white">📝 프로젝트 신청 내역</h2>
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">대기 {projectApplications.filter(a => a.status === 'PENDING').length}</span>
      </div>
      {projectApplications.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">신청 내역이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {projectApplications.map(app => (
            <div key={app.id} className="border dark:border-gray-600 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium dark:text-white">{app.artist_name} / {app.song_title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{app.client_name} · {new Date(app.created_at).toLocaleDateString('ko-KR')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">희망 미션일: {app.mission_date ?? '미정'}</p>
                  {app.has_cover && <p className="text-xs text-purple-600">커버 옵션: {app.cover_count}명</p>}
                  {app.requirements && <p className="text-xs text-gray-600 mt-1">{app.requirements}</p>}
                  {app.jacket_image && <img src={app.jacket_image} className="w-16 h-16 rounded-lg object-cover mt-1" />}
                </div>
                <div className="flex flex-col gap-1 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-1 rounded-full text-center ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                    {app.status === 'PENDING' ? '검토중' : app.status === 'APPROVED' ? '승인' : '거절'}
                  </span>
                  {app.status === 'PENDING' && (
                    <button onClick={() => onApprove(app)} className="text-xs bg-green-500 text-white rounded px-2 py-1">승인</button>
                  )}
                  {app.status === 'APPROVED' && !app.project_code && (
                    <button onClick={() => onLoad(app)} className="text-xs bg-blue-500 text-white rounded px-2 py-1">불러오기</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
