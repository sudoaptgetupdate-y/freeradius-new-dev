import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ใช้ path.resolve(process.cwd(), ...) เป็นวิธีที่ถูกต้องและทันสมัยที่สุด
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }
})