'use client'
import React from 'react'

type Props = {
  allProjects: any[]
  myParticipations: any[]
  projectCode: string
  projectListPage: number
  setProjectListPage: (page: number | ((p: number) => number)) => void
  PAGE_SIZE: number
  isCoverPossible: boolean
  isCoverApproved: boolean
  onSelectProject: (projectCode: string) => void
  onDeselectProject: () => void
}

export default function ParticipantProjectList({ allProjects, myParticipations, projectCode, projectListPage, setProjectListPage, PAGE_SIZE, isCoverPossible, isCoverApproved, onSelectProject, onDeselectProject }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <h2 className="font-bold mb-3">📋 전체 프로젝트 목록</h2>
      {allProjects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">진행중인 프로젝트가 없습니다.</p>
      ) : (
        <>
          <div className="space-y-2">
            {allProjects.slice(projectListPage * PAGE_SIZE, (projectListPage + 1) * PAGE_SIZE).map((project) => {
              const isFull = project.max_participants > 0 && (project.current_participants ?? 0) >= project.max_participants
              const isJoined = myParticipations.some(p => p.project_code.toLowerCase() === project.project_code.toLowerCase())
              const isCompleted = project.status === 'COMPLETED'
              const coverFull = project.cover_video_count > 0 && (project.cover_current ?? 0) >= project.cover_video_count
              const canCover = isCoverPossible && isCoverApproved && project.cover_video_count > 0

              const getStatusButton = () => {
                if (isCompleted) return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">종료</span>
                if (isJoined) {
                  return (
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">참여중 ✅</span>
                      {canCover && !myParticipations.some(p => p.project_code.toLowerCase() === project.project_code.toLowerCase() && p.is_cover) && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">커버 가능</span>
                      )}
                    </div>
                  )
                }
                if (isFull && !canCover) return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-500">마감</span>
                return (
                  <div className="flex flex-col gap-1 items-end">
                    {!isFull && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">참여 가능</span>}
                    {canCover && !coverFull && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">커버 가능</span>}
                  </div>
                )
              }

              return (
                <div key={project.id} className={`border rounded-lg p-3 cursor-pointer ${projectCode === project.project_code ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => {
                  if (!isCompleted) {
                    if (projectCode === project.project_code) {
                      onDeselectProject()
                    } else {
                      onSelectProject(project.project_code)
                    }
                  }
                }}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {project.cover_image_url && (
                        <img src={project.cover_image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{project.artist_name || project.client_name} / {project.song_title ?? project.product_content}</p>
                        <p className="text-xs text-gray-500">모집일: {project.mission_date ?? '미정'}</p>
                        {project.start_date && (
                          <p className="text-xs text-gray-500">미션일: {project.start_date}</p>
                        )}
                        <p className="text-xs text-gray-500">참여인원: {project.current_participants ?? 0}{project.max_participants > 0 ? `/${project.max_participants}` : ''}{project.cover_video_count > 0 ? ` + 커버 ${project.cover_current ?? 0}/${project.cover_video_count}` : ''}</p>
                      </div>
                    </div>
                    {getStatusButton()}
                  </div>
                </div>
              )
            })}
          </div>
          {allProjects.length > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => setProjectListPage(p => Math.max(0, p - 1))} disabled={projectListPage === 0} className="text-xs px-3 py-1 border rounded disabled:opacity-30">이전</button>
              <div className="flex gap-1">
                {Array.from({length: Math.ceil(allProjects.length / PAGE_SIZE)}, (_, i) => (
                  <button key={i} onClick={() => setProjectListPage(i)} className={`text-xs px-2 py-1 border rounded ${projectListPage === i ? 'bg-blue-600 text-white border-blue-600' : ''}`}>{i + 1}</button>
                ))}
              </div>
              <button onClick={() => setProjectListPage(p => Math.min(Math.ceil(allProjects.length / PAGE_SIZE) - 1, p + 1))} disabled={(projectListPage + 1) * PAGE_SIZE >= allProjects.length} className="text-xs px-3 py-1 border rounded disabled:opacity-30">다음</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
