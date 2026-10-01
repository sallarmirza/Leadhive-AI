export type DemoScreen = 'platform' | 'channel' | 'persona' | 'content' | 'dashboard' | 'command-center' | 'analytics'
export interface Channel { id: string; title: string; thumbnail: string; subscribers: string | null; views: string | null; videos: string | null }
export interface Profile { business_name: string; website: string; services: string; brand_tone: string; ai_rules: string }
export interface Video { video_id: string; title: string; thumbnail: string }
export interface VideoMetrics extends Video { views: number; comments: number; likes: number }
export interface Schedule { mode: string; target_date: string; start_time: string; end_time: string }
export interface Workspace { profile: Profile; selection: string[]; schedule: Schedule; running: boolean; automation_ready: boolean }
export interface Session { channels: Channel[]; selected: string | null; csrf: string }
export interface Activity { author: string; comment: string; reply: string; timestamp: string }
export interface ScreenNavigation { navigate: (screen: DemoScreen) => void }
export const screenLabels: Record<DemoScreen, string> = {
  platform: 'YouTube Intelligence', channel: 'Channel', persona: 'AI Persona', content: 'Video Library',
  dashboard: 'Overview', 'command-center': 'Command Center', analytics: 'Analytics',
}
export function screenFromHash(): DemoScreen {
  const candidate = window.location.hash.slice(1)
  return Object.hasOwn(screenLabels, candidate) ? candidate as DemoScreen : 'platform'
}
