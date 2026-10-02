import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const rawBackend = 'https://8qgnw9pl-8001.inc1.devtunnels.ms'
  if (!rawBackend) {
    throw new Error('VITE_YOUTUBE_API_URL is not set')
  }
  const backend = rawBackend.replace(/\/+$/, '')
  console.log('[vite] proxy target:', backend)

  const base = {
    target: backend,
    changeOrigin: true,
    secure: true,
    headers: { 'X-Tunnel-Skip-AntiPhishing-Page': 'true' },
    configure: (proxy: any) => {
      proxy.on('error', (err: Error, req: { url?: string }) => {
        console.error('[proxy error]', req.url, err.message)
      })
      proxy.on('proxyReq', (proxyReq: { path: string }, req: { method?: string; url?: string }) => {
        console.log('[proxy ->]', req.method, req.url, '=>', backend + proxyReq.path)
      })
      proxy.on('proxyRes', (proxyRes: { statusCode?: number }, req: { url?: string }) => {
        console.log('[proxy <-]', proxyRes.statusCode, req.url)
      })
    },
  }

  // Let browser page navigations fall through to the SPA; proxy only fetch/XHR.
  const spaSafe = {
    ...base,
    bypass: (req: { headers: { accept?: string } }) =>
      req.headers.accept?.includes('text/html') ? '/index.html' : undefined,
  }

  const backendProxy = {
    // OAuth: frontend calls /api/youtube/auth/*, backend serves /auth/youtube/*
    '/api/youtube/auth': {
      ...base,
      rewrite: (p: string) => p.replace('/api/youtube/auth', '/auth/youtube'),
    },
    '/api': base,
    '/save-profile': base,
    '/save-selected-videos': base,
    // Same names as possible frontend routes, so keep SPA navigation working
    '/dashboard': spaSafe,
    '/analytics': spaSafe,
  }

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },

    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: backendProxy,
    },
    preview: { proxy: backendProxy },
  }
})