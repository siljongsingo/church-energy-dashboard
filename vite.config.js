import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/church-energy-dashboard/',  // ← 이 줄이 핵심!
})
