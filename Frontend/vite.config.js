import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = parseInt(env.VITE_PORT || env.PORT || '5173', 10)
  const backendTarget = env.VITE_BACKEND_URL || env.BACKEND_URL || 'http://localhost:5000'

  return {
    plugins: [tailwindcss(), react()],
    server: {
      port: frontendPort,
      allowedHosts: ['pharsyde.ca', 'www.pharsyde.ca', '.pharsyde.ca'],
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  }
})
