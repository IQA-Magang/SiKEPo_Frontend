import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'sikepo-be.odeandialamsyah.my.id',
        changeOrigin: true,
      },
      '/recaptcha': {
        target: 'sikepo-be.odeandialamsyah.my.id',
        changeOrigin: true,
      },
      '/static': {
        target: 'sikepo-be.odeandialamsyah.my.id',
        changeOrigin: true,
      },
    },
  },
});
