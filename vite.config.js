import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://k45l2pqb-5000.asse.devtunnels.ms',
        changeOrigin: true,
      },
      '/recaptcha': {
        target: 'https://k45l2pqb-5000.asse.devtunnels.ms',
        changeOrigin: true,
      },
      '/static': {
        target: 'https://k45l2pqb-5000.asse.devtunnels.ms',
        changeOrigin: true,
      },
    },
  },
});
