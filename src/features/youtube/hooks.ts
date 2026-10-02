import { useCallback, useEffect, useState } from 'react'
import { YoutubeApiError, youtubeAuthUrl, youtubeRequest } from './api'
import type { Channel, Profile, Schedule, Session, Video, Workspace } from './types'

const CHANNEL_STORAGE_KEY = 'leadhive.youtube.channel_id'
const blankProfile: Profile = { business_name: '', website: '', services: '', brand_tone: '', ai_rules: '' }
const blankSchedule: Schedule = { mode: 'all', target_date: '', start_time: '', end_time: '' }
const emptySession: Session = { channels: [], selected: null, csrf: '' }

// Single place to change when these backend routes move under /api.
const WORKSPACE_PATH = '/api/youtube/workspace'
const dashboardPath = (channelId: string) => '/dashboard/' + encodeURIComponent(channelId)
const channelApi = (channelId: string, resource: string) =>
  '/api/channels/' + encodeURIComponent(channelId) + '/' + resource

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

type WorkspaceResponse = {
  channels?: unknown
  selected?: unknown
  selected_channel_id?: unknown
  current_channel_id?: unknown
  csrf?: unknown
  csrf_token?: unknown
}

type DashboardResponse = Partial<Workspace> & {
  channel?: Partial<Channel>
  channel_id?: string
  channel_title?: string
  title?: string
  thumbnail?: string
  subscribers?: string | number | null
  views?: string | number | null
  video_count?: string | number | null
  videos?: Video[]
  uploads?: Video[]
  selected_videos?: Array<string | Partial<Video>>
  video_ids?: string[]
  bot_running?: boolean
  running?: boolean
  is_running?: boolean
  schedule?: Partial<Schedule>
  profile?: Partial<Profile>
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function nullableString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function readSelectedChannelId() {
  const params = new URLSearchParams(window.location.search)
  for (const key of ['channel_id', 'channel', 'selected_channel', 'id']) {
    const value = stringValue(params.get(key))
    if (value) return value
  }
  try {
    return stringValue(window.localStorage.getItem(CHANNEL_STORAGE_KEY))
  } catch {
    return null
  }
}

function rememberSelectedChannelId(channelId: string) {
  try {
    window.localStorage.setItem(CHANNEL_STORAGE_KEY, channelId)
  } catch {
    // Storage can be unavailable in private contexts; the in-memory selection still works.
  }
}

function forgetSelectedChannelId() {
  try {
    window.localStorage.removeItem(CHANNEL_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// Backend OAuth callback redirects back with ?auth=success|failed.
function readAuthResult(): 'success' | 'failed' | null {
  const auth = new URLSearchParams(window.location.search).get('auth')
  if (!auth) return null
  return auth === 'failed' ? 'failed' : 'success'
}

function clearAuthParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('auth')) return
  url.searchParams.delete('auth')
  url.searchParams.delete('channel_id')
  window.history.replaceState(null, '', url.pathname + url.search + url.hash)
}

function selectedVideos(value: DashboardResponse) {
  const candidates = [value.selection, value.video_ids, value.selected_videos]
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    return candidate
      .map(item => typeof item === 'string' ? item : stringValue(item.video_id))
      .filter((item): item is string => Boolean(item))
  }
  return []
}

function normalizeVideos(value: DashboardResponse) {
  const videos = Array.isArray(value.videos) ? value.videos : Array.isArray(value.uploads) ? value.uploads : []
  return videos
    .map(video => ({
      video_id: stringValue(video.video_id) || stringValue((video as { id?: unknown }).id) || '',
      title: stringValue(video.title) || 'Untitled video',
      thumbnail: stringValue(video.thumbnail) || '',
    }))
    .filter(video => video.video_id)
}

function normalizeProfile(value: DashboardResponse): Profile {
  return { ...blankProfile, ...(value.profile || {}) }
}

function normalizeSchedule(value: DashboardResponse): Schedule {
  return { ...blankSchedule, ...(value.schedule || {}) }
}

function parseChannel(raw: unknown): Channel | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = stringValue(item.id) || stringValue(item.channel_id)
  if (!id) return null
  return {
    id,
    title: stringValue(item.title) || stringValue(item.channel_title) || id,
    thumbnail: stringValue(item.thumbnail) || '',
    subscribers: nullableString(item.subscribers ?? item.subscriber_count),
    views: nullableString(item.views ?? item.view_count),
    videos: nullableString(item.videos ?? item.video_count),
  }
}

// Fill in fresher stats from the dashboard payload without losing what the workspace gave us.
function mergeChannel(channel: Channel, value: DashboardResponse): Channel {
  const nested = value.channel
  return {
    ...channel,
    title: stringValue(nested?.title) || stringValue(value.title) || stringValue(value.channel_title) || channel.title,
    thumbnail: stringValue(nested?.thumbnail) || stringValue(value.thumbnail) || channel.thumbnail,
    subscribers: nullableString(nested?.subscribers ?? value.subscribers) ?? channel.subscribers,
    views: nullableString(nested?.views ?? value.views) ?? channel.views,
    videos: nullableString(nested?.videos ?? value.video_count) ?? channel.videos,
  }
}

function withChannelId<T extends object>(body: T, channelId: string) {
  return { channel_id: channelId, ...body }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function isUnauthorized(error: unknown) {
  return error instanceof YoutubeApiError && error.status === 401
}

export function useYoutubeResource<T>(path: string | null, refresh = 0) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setError(''); setStatus(null)
    if (!path) { setLoading(false); return }
    setLoading(true)
    youtubeRequest<T>(path, { signal: controller.signal })
      .then(setData)
      .catch(error => {
        if (controller.signal.aborted) return
        setStatus(error instanceof YoutubeApiError ? error.status : null)
        setError(errorMessage(error, 'Unable to load this section.'))
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, refresh])
  return { data, error, status, loading }
}

export function useYouTubeIntelligence() {
  const [initial] = useState(() => ({ channelId: readSelectedChannelId(), authResult: readAuthResult() }))
  const [refresh, setRefresh] = useState(0)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session>(emptySession)
  const [error, setError] = useState(initial.authResult === 'failed' ? 'Google sign-in failed. Please try again.' : '')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState<Profile>(blankProfile)
  const [selection, setSelection] = useState<string[]>([])
  const [schedule, setSchedule] = useState<Schedule>(blankSchedule)
  const [running, setRunning] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [automationReady, setAutomationReady] = useState(false)
  const selected = session.selected
  const dashboard = useYoutubeResource<DashboardResponse>(
    authStatus === 'authenticated' && selected ? dashboardPath(selected) : null,
    refresh,
  )

  useEffect(() => { clearAuthParams() }, [])

  // 1) Load the real session + channels from the backend.
  useEffect(() => {
    const controller = new AbortController()
    youtubeRequest<WorkspaceResponse>(WORKSPACE_PATH, { signal: controller.signal })
      .then(workspace => {
        const channels = (Array.isArray(workspace.channels) ? workspace.channels : [])
          .map(parseChannel)
          .filter((channel): channel is Channel => Boolean(channel))
        const fromServer =
          stringValue(workspace.selected) ||
          stringValue(workspace.selected_channel_id) ||
          stringValue(workspace.current_channel_id)
        const chosen =
          [initial.channelId, fromServer].find(id => id && channels.some(channel => channel.id === id)) ||
          channels[0]?.id ||
          null
        if (chosen) rememberSelectedChannelId(chosen)
        setSession({
          channels,
          selected: chosen,
          csrf: stringValue(workspace.csrf) || stringValue(workspace.csrf_token) || '',
        })
        setAuthStatus('authenticated')
      })
      .catch(error => {
        if (controller.signal.aborted) return
        if (isUnauthorized(error)) {
          setSession(emptySession)
          setAuthStatus('anonymous')
          return
        }
        setError(errorMessage(error, 'Unable to reach YouTube Intelligence.'))
        setAuthStatus('error')
      })
    return () => controller.abort()
  }, [initial.channelId])

  // 2) Session expired while using the app.
  useEffect(() => {
    if (dashboard.status === 401) {
      setSession(emptySession)
      setAuthStatus('anonymous')
    }
  }, [dashboard.status])

  // 3) Hydrate screen state from the dashboard payload.
  useEffect(() => {
    if (!dashboard.data) {
      if (!selected) {
        setProfile(blankProfile); setSelection([]); setSchedule(blankSchedule); setRunning(false); setVideos([]); setAutomationReady(false)
      }
      return
    }
    const data = dashboard.data
    setProfile(normalizeProfile(data))
    setSelection(selectedVideos(data))
    setSchedule(normalizeSchedule(data))
    setRunning(Boolean(data.running ?? data.bot_running ?? data.is_running))
    setVideos(normalizeVideos(data))
    setAutomationReady(Boolean(data.automation_ready ?? true))
    // Update only the selected channel; keep other channels and the CSRF token.
    setSession(current => ({
      ...current,
      channels: current.channels.map(channel => channel.id === selected ? mergeChannel(channel, data) : channel),
    }))
  }, [dashboard.data, selected])

  const mutate = useCallback(async (path: string, body: unknown, method = 'POST') => {
    const channelId = session.selected
    const csrf = session.csrf || undefined
    setBusy(true); setError('')
    try {
      if (path === '/channel') {
        const nextChannel = stringValue((body as { channel?: unknown }).channel)
        if (!nextChannel) throw new Error('Missing channel id.')
        if (!session.channels.some(channel => channel.id === nextChannel)) {
          throw new Error('That channel is not connected to your account.')
        }
        rememberSelectedChannelId(nextChannel)
        setSession(current => ({ ...current, selected: nextChannel }))
        return true
      }
      if (!channelId) throw new Error('Connect your YouTube channel before saving changes.')

      if (path === '/profile') {
        await youtubeRequest(channelApi(channelId, 'profile'), { method: 'PUT', body, csrf })
      } else if (path === '/selection') {
        await youtubeRequest('/save-selected-videos', {
          method: 'POST', body: withChannelId(body as { video_ids: string[] }, channelId), csrf,
        })
      } else if (path === '/schedule') {
        await youtubeRequest(channelApi(channelId, 'schedule'), { method: 'PUT', body, csrf })
      } else if (path === '/automation') {
        await youtubeRequest('/api/toggle-bot/' + encodeURIComponent(channelId), { method: 'POST', body, csrf })
      } else {
        await youtubeRequest(path, { method, body, csrf })
      }
      setRefresh(value => value + 1)
      return true
    } catch (error) {
      if (isUnauthorized(error)) {
        setSession(emptySession)
        setAuthStatus('anonymous')
        setError('Your session expired. Please reconnect your YouTube channel.')
      } else {
        setError(errorMessage(error, 'Unable to save your changes.'))
      }
      return false
    } finally { setBusy(false) }
  }, [session])

  async function chooseChannel(channel: string) {
    if (await mutate('/channel', { channel }, 'POST')) {
      setRefresh(value => value + 1)
      return true
    }
    return false
  }

  // Full-page navigation: the backend sets the OAuth state cookie and redirects to Google.
  const connect = useCallback(() => {
    window.location.assign(youtubeAuthUrl('/auth/youtube/login'))
  }, [])

  const logout = useCallback(async () => {
    try {
      await youtubeRequest('/api/auth/logout', { method: 'POST', csrf: session.csrf || undefined })
    } catch (error) {
      if (!isUnauthorized(error)) {
        setError(errorMessage(error, 'Unable to sign out.'))
        return false
      }
    }
    forgetSelectedChannelId()
    setSession(emptySession)
    setAuthStatus('anonymous')
    return true
  }, [session.csrf])

  return {
    session,
    authenticated: authStatus === 'authenticated',
    authStatus,
    loading: authStatus === 'loading' || dashboard.loading,
    error: error || (dashboard.status === 401 ? '' : dashboard.error),
    busy, profile, setProfile, selection, setSelection, schedule, setSchedule, running, setRunning,
    videos, automationReady,
    channel: session.channels.find(channel => channel.id === session.selected) || null,
    chooseChannel, connect, logout, mutate, reload: () => setRefresh(value => value + 1),
  }
}
export type YouTubeController = ReturnType<typeof useYouTubeIntelligence>