import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      // 502 from the dev server usually means nothing is listening here — start alonix-idp-node-backend (default PORT=5005).
      '/api': { target: 'http://localhost:5005', changeOrigin: true },
    },
  },
})
