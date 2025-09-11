import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Works locally and on GitHub Actions
const repo = process.env.GITHUB_REPOSITORY?.split('/').pop()
const isCI = !!process.env.GITHUB_ACTIONS
const base = isCI && repo ? `/${repo}/` : '/peerlearn-pro/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
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
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'maath'],
  },
})
