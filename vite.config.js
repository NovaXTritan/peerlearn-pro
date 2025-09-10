import {" defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/peerlearn-pro/',
  server: { port: 5173 }
})