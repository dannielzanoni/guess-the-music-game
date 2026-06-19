import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DEEZER_API_HOST = 'deezerdevs-deezer.p.rapidapi.com'
const DEFAULT_DEEZER_API_URL = `https://${DEFAULT_DEEZER_API_HOST}`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  const deezerApiUrl = env.DEEZER_API_URL || DEFAULT_DEEZER_API_URL
  const deezerApiHost = env.DEEZER_API_HOST || DEFAULT_DEEZER_API_HOST

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        '/api/deezer': {
          target: deezerApiUrl,
          changeOrigin: true,
          rewrite: (requestPath) =>
            requestPath.replace(/^\/api\/deezer(?:\/search)?/, '/search'),
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': deezerApiHost,
            'x-rapidapi-key': env.RAPIDAPI_KEY || '',
          },
        },
      },
    },
  }
})
