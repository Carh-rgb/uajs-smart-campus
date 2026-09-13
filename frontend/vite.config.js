import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Coincide con FRONTEND_ORIGIN en los .env del backend (CORS).
    port: 5183,
  },
})
