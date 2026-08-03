'use client'

type Props = {
  projects: any[]
  selectedProject: any
  projectPage: number
  setProjectPage: (page: number | ((p: number) => number)) => void
  PAGE_SIZE: number
  onSelectProject: (project: any) => void
}

export default function AdminProjectList({ projects, selectedProject, projectPage, setProjectPage, PAGE_SIZE, onSelectProject }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold">프로젝트 목록</h2>
        <div className="flex gap-2 text-xs">
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">대기 {projects.filter(p => p.status === 'PENDING').length}</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">진행 {projects.filter(p => p.status === 'ONGOING').length}</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">완료 {projects.filter(p => p.status === 'COMPLETED').length}</span>
        </div>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">프로젝트가 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {projects.slice(projectPage * PAGE_SIZE, (projectPage + 1) * PAGE_SIZE).map((project) => (
              <div key={project.id} onClick={() => onSelectProject(project)} className={`border rounded-lg p-3 cursor-pointer ${selectedProject?.id === project.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {project.cover_image_url && (
                      <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                      <p className="text-xs text-gray-400">프로젝트 코드: {project.project_code}</p>
                      <p className="text-xs text-gray-500">👥 참여인원: {project.current_participants ?? 0}/{project.max_participants > 0 ? project.max_participants : '∞'}</p>
                      {project.cover_video_count > 0 && (
                        <p className="text-xs text-purple-500">🎵 커버: {project.cover_current ?? 0}/{project.cover_video_count}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${project.status === 'ONGOING' ? 'bg-green-100 text-green-700' : project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {project.status === 'ONGOING' ? '진행중' : project.status === 'PENDING' ? '대기중' : '완료'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-3">
            <button onClick={() => setProjectPage(p => Math.max(0, p - 1))} disabled={projectPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
            <div className="flex gap-1">
              {Array.from({length: Math.ceil(projects.length / PAGE_SIZE)}, (_, i) => (
                <button key={i} onClick={() => setProjectPage(i)} className={`text-xs px-2 py-1 border rounded ${projectPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setProjectPage(p => Math.min(Math.ceil(projects.length / PAGE_SIZE) - 1, p + 1))} disabled={(projectPage + 1) * PAGE_SIZE >= projects.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
          </div>
        </>
      )}
    </div>
  )
}
