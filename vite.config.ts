import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '')

  const youtubeProxy = {
    '/api/youtube': {
      target: env.VITE_YOUTUBE_API_URL,
      changeOrigin: true,
      secure: true,

      // bot.py keeps OAuth at /auth/youtube, while session remains under /api/youtube.
      // Map only those two OAuth endpoints; do not remove the API prefix generally.
      rewrite: (path: string) => {
        if (path === '/api/youtube/auth/login') {
          return '/auth/youtube/login'
        }

        if (path.startsWith('/api/youtube/auth/callback')) {
          return path.replace(
            '/api/youtube/auth/callback',
            '/auth/youtube/callback'
          )
        }

        return path
      },
    },
  }

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },

    server: {
      proxy: youtubeProxy,
    },

    preview: {
      proxy: youtubeProxy,
    },
  }
})
