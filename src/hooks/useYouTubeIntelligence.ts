import { useCallback, useEffect, useMemo, useState } from 'react'
import { youtubeRequest } from '../services/youtubeApi'
import type { Channel, Profile, Schedule, Session, Video, Workspace } from '../features/youtube/types'

const CHANNEL_STORAGE_KEY = 'leadhive.youtube.channel_id'
const blankProfile: Profile = { business_name: '', website: '', services: '', brand_tone: '', ai_rules: '' }
const blankSchedule: Schedule = { mode: 'all', target_date: '', start_time: '', end_time: '' }

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

function normalizeChannel(channelId: string, value?: DashboardResponse): Channel {
  const source = value?.channel || value || {}
  return {
    id: channelId,
    title: stringValue(source.title) || stringValue(value?.channel_title) || channelId,
    thumbnail: stringValue(source.thumbnail) || stringValue(value?.thumbnail) || '',
    subscribers: nullableString(source.subscribers ?? value?.subscribers),
    views: nullableString(source.views ?? value?.views),
    videos: nullableString(source.videos ?? value?.video_count),
  }
}

function sessionFor(channelId: string | null, dashboard?: DashboardResponse): Session {
  return {
    channels: channelId ? [normalizeChannel(channelId, dashboard)] : [],
    selected: channelId,
    csrf: '',
  }
}

function withChannelId<T extends object>(body: T, channelId: string) {
  return { channel_id: channelId, ...body }
}

export function useYoutubeResource<T>(path: string | null, refresh = 0) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setError('')
    if (!path) { setLoading(false); return }
    setLoading(true)
    youtubeRequest<T>(path, { signal: controller.signal })
      .then(setData)
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load this section.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, refresh])
  return { data, error, loading }
}

export function useYouTubeIntelligence() {
  const initialChannelId = useMemo(readSelectedChannelId, [])
  const [refresh, setRefresh] = useState(0)
  const [session, setSession] = useState<Session | null>(() => sessionFor(initialChannelId))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState<Profile>(blankProfile)
  const [selection, setSelection] = useState<string[]>([])
  const [schedule, setSchedule] = useState<Schedule>(blankSchedule)
  const [running, setRunning] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])
  const [automationReady, setAutomationReady] = useState(false)
  const selected = session?.selected || null
  const dashboard = useYoutubeResource<DashboardResponse>(selected ? '/dashboard/' + encodeURIComponent(selected) : null, refresh)

  useEffect(() => {
    if (!dashboard.data) {
      if (!selected) {
        setProfile(blankProfile); setSelection([]); setSchedule(blankSchedule); setRunning(false); setVideos([]); setAutomationReady(false)
      }
      return
    }
    setProfile(normalizeProfile(dashboard.data))
    setSelection(selectedVideos(dashboard.data))
    setSchedule(normalizeSchedule(dashboard.data))
    setRunning(Boolean(dashboard.data.running ?? dashboard.data.bot_running ?? dashboard.data.is_running))
    setVideos(normalizeVideos(dashboard.data))
    setAutomationReady(Boolean(dashboard.data.automation_ready ?? true))
    setSession(sessionFor(selected, dashboard.data))
  }, [dashboard.data, selected])

  const mutate = useCallback(async (path: string, body: unknown, method = 'POST') => {
    const channelId = session?.selected
    setBusy(true); setError('')
    try {
      if (path === '/channel') {
        const nextChannel = stringValue((body as { channel?: unknown }).channel)
        if (!nextChannel) throw new Error('Missing channel id.')
        rememberSelectedChannelId(nextChannel)
        setSession(sessionFor(nextChannel))
        return true
      }
      if (!channelId) throw new Error('Connect your YouTube channel before saving changes.')

      if (path === '/profile') {
        await youtubeRequest('/save-profile', { method: 'POST', body: withChannelId(body as Profile, channelId) })
      } else if (path === '/selection') {
        await youtubeRequest('/save-selected-videos', { method: 'POST', body: withChannelId(body as { video_ids: string[] }, channelId) })
      } else if (path === '/schedule') {
        await youtubeRequest('/api/update-schedule/' + encodeURIComponent(channelId), { method: 'POST', body })
      } else if (path === '/automation') {
        await youtubeRequest('/api/toggle-bot/' + encodeURIComponent(channelId), { method: 'POST', body })
      } else {
        await youtubeRequest(path, { method, body })
      }
      setRefresh(value => value + 1)
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save your changes.')
      return false
    } finally { setBusy(false) }
  }, [session?.selected])

  async function chooseChannel(channel: string) {
    if (await mutate('/channel', { channel }, 'POST')) {
      setRefresh(value => value + 1)
      return true
    }
    return false
  }

  return {
    session, loading: dashboard.loading, error: error || dashboard.error,
    busy, profile, setProfile, selection, setSelection, schedule, setSchedule, running, setRunning,
    videos, automationReady,
    channel: session?.channels.find(channel => channel.id === session.selected) || null,
    chooseChannel, mutate, reload: () => setRefresh(value => value + 1),
  }
}
export type YouTubeController = ReturnType<typeof useYouTubeIntelligence>