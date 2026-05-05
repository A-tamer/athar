import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Allow ngrok (and similar) tunnel hostnames during local dev
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', 'localhost'],
  }
})
