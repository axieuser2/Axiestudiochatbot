import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://stefan0987.app.n8n.cloud/webhook-te',
        changeOrigin: true,
        rewrite: (path) => '',
        secure: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
