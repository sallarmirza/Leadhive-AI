export class YoutubeApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

// Always same-origin. Vite (dev) or Vercel rewrites (prod) forward to the backend,
// so cookies are first-party on the frontend host.
export function youtubeAuthUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  // Backend serves /auth/youtube/*; the proxy exposes it as /api/youtube/auth/*
  return normalized.replace(/^\/auth\/youtube/, '/api/youtube/auth')
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') ? path : `/${path}`
}

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  if (!response.headers.get('content-type')?.includes('application/json')) return text
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function detailMessage(data: unknown) {
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  return 'YouTube Intelligence is currently unavailable. Please try again.'
}

export async function youtubeRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; csrf?: string; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response
  const requestUrl = resolveApiUrl(path)
  try {
    response = await fetch(requestUrl, {
      method: options.method || 'GET',
      credentials: 'include',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.csrf ? { 'X-Leadhive-CSRF': options.csrf } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    })
  } catch (error) {
    if (!options.signal?.aborted) console.error('[YouTube API] Request failed', { path, error })
    throw error
  }
  const data = await responseBody(response)
  if (!response.ok || data === null || typeof data === 'string') {
    console.error('[YouTube API] Unsuccessful response', { path, status: response.status, body: data })
    throw new YoutubeApiError(detailMessage(data), response.status)
  }
  return data as T
}