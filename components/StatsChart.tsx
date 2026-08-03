'use client'

import PlatformIcon from './PlatformIcon'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type StatsChartProps = {
  data: any[]
  platform: 'instagram' | 'youtube' | 'tiktok'
  likesKey: string
  commentsKey: string
  viewsKey: string
  audioKey?: string
  likeLabel?: string
  containerRef?: React.RefObject<HTMLDivElement | null>
}

const platformConfig = {
  instagram: { label: '인스타그램', color: '#E1306C', likeLabel: '하트', textColor: 'text-pink-600' },
  youtube: { label: '유튜브', color: '#FF0000', likeLabel: '좋아요', textColor: 'text-red-600' },
  tiktok: { label: '틱톡', color: '#000000', likeLabel: '하트', textColor: 'text-black' },
}

export default function StatsChart({ data, platform, likesKey, commentsKey, viewsKey, audioKey, containerRef }: StatsChartProps) {
  const config = platformConfig[platform]
  const likeLabel = config.likeLabel
  const legendItems = audioKey ? [likeLabel, '댓글', '조회수', '음원사용'] : [likeLabel, '댓글', '조회수']

  return (
    <div className="mb-4" ref={containerRef}>
      <div className="flex items-center gap-1 mb-1">
        <PlatformIcon platform={platform} size={16} />
        <p className={`text-xs font-medium ${config.textColor}`}>{config.label}</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip wrapperStyle={{ zIndex: 9999 }} isAnimationActive={false} />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            content={({ payload }) => (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '10px', justifyContent: 'center' }}>
                {legendItems.map(name => {
                  const item = payload?.find((p: any) => p.value === name)
                  if (!item) return null
                  return (
                    <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="20" height="10">
                        <line x1="0" y1="5" x2="20" y2="5" stroke={item.color} strokeWidth="2" strokeDasharray={name === '댓글' ? '5 5' : name === '조회수' ? '3 3' : name === '음원사용' ? '2 2' : 'none'} />
                      </svg>
                      {name}
                    </span>
                  )
                })}
              </div>
            )}
          />
          <Line type="monotone" dataKey={likesKey} stroke="#FF4B6E" name={likeLabel} dot={false} />
          <Line type="monotone" dataKey={commentsKey} stroke="#4CAF50" name="댓글" dot={false} strokeDasharray="5 5" />
          <Line type="monotone" dataKey={viewsKey} stroke="#4B9EFF" name="조회수" dot={false} strokeDasharray="3 3" />
          {audioKey && <Line type="monotone" dataKey={audioKey} stroke="#9333EA" name="음원사용" dot={true} connectNulls={false} strokeDasharray="2 2" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
