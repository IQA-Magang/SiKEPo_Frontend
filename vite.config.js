import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://si-ke-po-backend-dkfe-31rhkxj8d-rendy-kamaluddins-projects.vercel.app',
        changeOrigin: true,
      },
      '/recaptcha': {
        target: 'https://si-ke-po-backend-dkfe-31rhkxj8d-rendy-kamaluddins-projects.vercel.app',
        changeOrigin: true,
      },
      '/static': {
        target: 'https://si-ke-po-backend-dkfe-31rhkxj8d-rendy-kamaluddins-projects.vercel.app',
        changeOrigin: true,
      },
    },
  },
});
