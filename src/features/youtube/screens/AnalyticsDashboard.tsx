import { useState } from 'react'
import { ArrowLeft, ChartNoAxesColumn, ExternalLink, RefreshCw } from 'lucide-react'
import { ConnectionRequired, EmptyState, Panel, PanelHeader, ResourceStatus, ScreenHeading } from '../../../features/youtube/DemoUI'
import { useYoutubeResource, type YouTubeController } from '../hooks'
import type { ScreenNavigation, VideoMetrics } from '../../../features/youtube/types'

export function AnalyticsDashboard({ controller: c, navigate }: ScreenNavigation & { controller: YouTubeController }) {
  const [refresh, setRefresh] = useState(0)
  const resource = useYoutubeResource<{ videos: VideoMetrics[] }>(
    c.channel ? '/analytics/' + encodeURIComponent(c.channel.id) : null,
    refresh
  )
  const videos = resource.data?.videos || []
  const totals = videos.reduce(
    (sum, video) => ({
      views: sum.views + video.views,
      comments: sum.comments + video.comments,
      likes: sum.likes + video.likes,
    }),
    { views: 0, comments: 0, likes: 0 }
  )
  const engagement = totals.views > 0 ? ((totals.comments + totals.likes) / totals.views) * 100 : 0
  const summary = [
    { label: 'Tracked Videos', value: videos.length.toLocaleString(), helper: c.channel?.title || 'Connected channel' },
    { label: 'Total Views', value: totals.views.toLocaleString(), helper: 'Across monitored content' },
    { label: 'Comments', value: totals.comments.toLocaleString(), helper: 'Community interactions' },
    { label: 'Engagement', value: engagement.toFixed(1) + '%', helper: 'Likes and comments per view' },
  ]

  return (
    <section className="yi-analytics-dashboard">
      <div className="td-heading-with-action">
        <ScreenHeading eyebrow="Analytics & Insights" title="Monitored video insights">
          Real-time view counts, comments, and community engagement metrics verified from YouTube.
        </ScreenHeading>
        <div className="yi-analytics-actions">
          <button className="td-button td-button-secondary" onClick={() => setRefresh(n => n + 1)}>
            <RefreshCw size={14} className={resource.loading ? 'td-spin' : ''} /> Refresh Data
          </button>
          <button className="td-button td-button-secondary" onClick={() => navigate('dashboard')}>
            <ArrowLeft size={15} /> Back to Overview
          </button>
        </div>
      </div>

      {!c.channel ? (
        <ConnectionRequired />
      ) : (
        <>
          <ResourceStatus loading={resource.loading} error={resource.error} retry={() => setRefresh(n => n + 1)} />

          <div className="yi-analytics-summary" aria-label="Analytics summary">
            {summary.map(item => (
              <article className="yi-analytics-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.helper}</small>
              </article>
            ))}
          </div>

          <Panel className="td-table-frame">
            <PanelHeader
              title="Monitored content performance"
              action={<span className="yi-video-count-badge">{videos.length} videos tracked</span>}
            >
              Real metrics reported directly via the YouTube Data API.
            </PanelHeader>

            <div className="td-table-wrapper">
              <table className="td-table td-analytics-table">
                <caption className="td-sr-only">YouTube video engagement metrics</caption>
                <thead>
                  <tr>
                    <th scope="col">Content</th>
                    <th scope="col" className="td-col-num">Views</th>
                    <th scope="col" className="td-col-num">Comments</th>
                    <th scope="col" className="td-col-num">Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map(video => (
                    <tr key={video.video_id}>
                      <td>
                        <a
                          className="yi-video-row"
                          href={'https://www.youtube.com/watch?v=' + encodeURIComponent(video.video_id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {video.thumbnail && <img src={video.thumbnail} alt="" loading="lazy" />}
                          <span className="yi-video-row-title">{video.title}</span>
                          <ExternalLink size={13} className="yi-video-ext" />
                        </a>
                      </td>
                      <td className="td-col-num yi-cell">{video.views.toLocaleString()}</td>
                      <td className="td-col-num yi-cell">{video.comments.toLocaleString()}</td>
                      <td className="td-col-num yi-cell">{video.likes.toLocaleString()}</td>
                    </tr>
                  ))}
                  {!videos.length && !resource.loading && !resource.error && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState icon={<ChartNoAxesColumn size={24} />} title="No analytics available yet.">
                          Select videos from your library to load their live performance statistics.
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </section>
  )
}
