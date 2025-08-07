// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy สำหรับ API (มีอยู่แล้ว)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // --- START: เพิ่มส่วนนี้ ---
      // Proxy สำหรับไฟล์ที่อัปโหลด
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // --- END ---
    }
  }
})