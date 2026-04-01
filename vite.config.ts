import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_BASE_URL || 'http://localhost:5005';

  return {
    plugins: [
      react(),
    ],
    server: {
      proxy: {
        // Use same-origin /api in browser, proxy to backend target from env.
        '/api': { target: proxyTarget, changeOrigin: true },
        '/socket.io': { target: proxyTarget, changeOrigin: true, ws: true },
      },
    },
  };
})
