import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bot, List, Play, Square, X } from 'lucide-react'
import { youtubeRequest } from '../../../services/youtubeApi'
import type { YouTubeController } from '../../../hooks/useYouTubeIntelligence'
import { ConnectionRequired, EmptyState, Panel, PanelHeader, ScreenHeading, StatusBadge, StepActions } from '../../../features/youtube/DemoUI'
import type { Activity, Schedule, ScreenNavigation } from '../../../features/youtube/types'

export function CommandCenter({ controller: c, navigate }: ScreenNavigation & { controller: YouTubeController }) {
  const [logs, setLogs] = useState<Activity[]>([])
  const [pollError, setPollError] = useState('')
  const [saved, setSaved] = useState(false)
  const confirm = useRef<HTMLDialogElement>(null)
  const selected = c.channel?.id

  useEffect(() => {
    if (!selected) return
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const result = await youtubeRequest<{ logs: Activity[]; running: boolean }>(
          '/api/logs/' + encodeURIComponent(selected!),
          { signal: abort.signal }
        )
        setLogs(result.logs)
        c.setRunning(result.running)
        setPollError('')
      } catch (error) {
        if (!abort.signal.aborted) setPollError(error instanceof Error ? error.message : 'Unable to load activity.')
      } finally {
        if (!abort.signal.aborted) timer = setTimeout(poll, 5000)
      }
    }
    void poll()
    return () => {
      abort.abort()
      clearTimeout(timer)
    }
  }, [selected, c.setRunning])

  function update(key: keyof Schedule, value: string) {
    c.setSchedule({ ...c.schedule, [key]: value })
    setSaved(false)
  }

  async function toggle(running: boolean) {
    if (await c.mutate('/automation', { running })) c.setRunning(running)
    confirm.current?.close()
  }

  return (
    <section className="yi-command-center">
      <ScreenHeading eyebrow="Operations Console" title="AI Command Center">
        Configure engagement rules and monitor live comment processing in real time.
      </ScreenHeading>

      {!c.channel ? (
        <ConnectionRequired />
      ) : (
        <>
          <div className="yi-operations-status" aria-label="Automation status overview">
            <div className="yi-operations-identity">
              <span className="yi-operations-mark">
                <Bot size={20} />
              </span>
              <div>
                <span>Operations Engine</span>
                <strong>{c.channel.title}</strong>
              </div>
            </div>

            <dl>
              <div>
                <dt>Engine Status</dt>
                <dd>
                  <StatusBadge tone={c.running ? 'success' : 'neutral'}>
                    {c.running ? 'Active (Running)' : 'Inactive'}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt>Target Videos</dt>
                <dd>{c.selection.length.toLocaleString()} monitored</dd>
              </div>
              <div>
                <dt>Filter Mode</dt>
                <dd>{c.schedule.mode === 'period' ? 'Scheduled Window' : 'All New Comments'}</dd>
              </div>
            </dl>
          </div>

          <div className="yi-operations-center">
            <Panel className="yi-control-rail">
              <PanelHeader title="Automation controls">Configure when and how LeadHive engages.</PanelHeader>

              <form
                className="yi-schedule-form"
                onSubmit={async event => {
                  event.preventDefault()
                  if (await c.mutate('/schedule', c.schedule)) setSaved(true)
                }}
              >
                <label>
                  <span>Engagement Mode</span>
                  <select value={c.schedule.mode} onChange={e => update('mode', e.target.value)}>
                    <option value="all">Reply to all new comments</option>
                    <option value="period">Scheduled date & time window</option>
                  </select>
                </label>

                {c.schedule.mode === 'period' && (
                  <div className="yi-time-window">
                    <label>
                      <span>Comment Date (UTC)</span>
                      <input
                        type="date"
                        required
                        value={c.schedule.target_date}
                        onChange={e => update('target_date', e.target.value)}
                      />
                    </label>
                    <div className="yi-time-row">
                      <label>
                        <span>Start Time (UTC)</span>
                        <input
                          type="time"
                          required
                          value={c.schedule.start_time}
                          onChange={e => update('start_time', e.target.value)}
                        />
                      </label>
                      <label>
                        <span>End Time (UTC)</span>
                        <input
                          type="time"
                          required
                          value={c.schedule.end_time}
                          onChange={e => update('end_time', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                )}

                <button className="td-button td-button-secondary" disabled={c.busy}>
                  Save Mode Settings
                </button>
                {saved && (
                  <p className="yi-saved" role="status">
                    Settings successfully saved.
                  </p>
                )}
              </form>

              <div className="yi-control-divider" />

              <div className="td-engine-status">
                <span>Engine State</span>
                <strong className={'td-status ' + (c.running ? 'yi-running' : '')}>
                  <i />
                  {c.running ? 'Processing comments' : 'Automation stopped'}
                </strong>
              </div>

              {!c.automationReady && (
                <p className="yi-service-note">
                  Automation requires a configured backend trial and active video selection.
                </p>
              )}

              <div className="yi-control-actions">
                <button
                  className={'button td-button ' + (c.running ? 'td-button-secondary' : 'td-button-primary')}
                  disabled={c.busy || (!c.running && (!c.automationReady || !c.selection.length))}
                  onClick={() => (c.running ? void toggle(false) : confirm.current?.showModal())}
                >
                  {c.running ? <Square size={15} /> : <Play size={15} />}
                  {c.running ? 'Stop Automation' : 'Start Automation'}
                </button>
                <button className="td-button td-button-quiet" onClick={() => navigate('analytics')}>
                  View Analytics <ArrowUpRight size={15} />
                </button>
              </div>
            </Panel>

            <Panel className="td-activity">
              <div className="yi-activity-heading">
                <div>
                  <span className="td-panel-kicker">Live Stream</span>
                  <h2>Observed Channel Interactions</h2>
                  <p>Recent comments processed by LeadHive AI on your channel.</p>
                </div>
                <StatusBadge tone={c.running ? 'success' : 'neutral'}>
                  {c.running ? 'Monitoring Live' : 'Standby'}
                </StatusBadge>
              </div>

              {pollError && (
                <p className="td-error" role="alert">
                  {pollError}
                </p>
              )}

              <div className="yi-activity-feed">
                {logs.length ? (
                  logs.map((log, index) => (
                    <article className="yi-interaction" key={index}>
                      <header>
                        <div className="yi-interaction-author">
                          <span className="yi-activity-index">{String(index + 1).padStart(2, '0')}</span>
                          <strong>{log.author}</strong>
                        </div>
                        <time>{log.timestamp}</time>
                      </header>
                      <p className="yi-interaction-comment">{log.comment}</p>
                      <div className="yi-interaction-reply">
                        <span>LeadHive AI Response</span>
                        <p>{log.reply}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState icon={<List size={24} />} title="No interactions recorded yet.">
                    Live channel comments and automated LeadHive replies will appear here once the engine processes new activity.
                  </EmptyState>
                )}
              </div>

              <footer className="yi-activity-footer">
                <span>{logs.length.toLocaleString()} recorded interaction{logs.length === 1 ? '' : 's'}</span>
                <span>{c.running ? 'Poller active (5s interval)' : 'Engine idle'}</span>
              </footer>
            </Panel>
          </div>

          <StepActions back={() => navigate('content')} next={() => navigate('dashboard')} label="Return to Overview" />

          <dialog ref={confirm} className="td-dialog" aria-labelledby="start-title">
            <button
              className="td-close td-button td-button-quiet"
              aria-label="Close confirmation"
              onClick={() => confirm.current?.close()}
            >
              <X size={18} />
            </button>
            <p className="td-eyebrow">Public Automation Confirmation</p>
            <h2 id="start-title">Start AI engagement?</h2>
            <p>
              LeadHive AI will begin replying publicly to new comments on your {c.selection.length} selected YouTube videos using your configured brand persona.
            </p>
            <button className="button td-button td-button-primary" disabled={c.busy} onClick={() => void toggle(true)}>
              Confirm & Start Replying
            </button>
          </dialog>
        </>
      )}
    </section>
  )
}