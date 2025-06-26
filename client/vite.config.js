// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // ✅ Fix the port here
    strictPort: true // ✅ Don't allow Vite to auto-switch
  }
})
