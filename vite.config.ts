import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Analyses-quantitatives-helper/',
  build: {
    outDir: 'docs',
  },
})