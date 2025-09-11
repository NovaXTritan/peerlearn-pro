import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Auto-pick correct base on GitHub Actions (repo name), fall back for local dev.
const repo = process.env.GITHUB_REPOSITORY?.split('/').pop()
const isCI = !!process.env.GITHUB_ACTIONS
const base = isCI && repo ? `/${repo}/` : '/peerlearn-pro/' // <- change fallback if you rename the repo

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5173, open: true },
  preview: { port: 5173 },

  // Build tuned for React + three/R3F
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'maath'],
        },
      },
    },
  },

  // Speed up dev install/resolve on CI and local
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'maath'],
  },

  // Some libs reference process.env; keep it harmless in Vite.
  define: { 'process.env': {} },
})
