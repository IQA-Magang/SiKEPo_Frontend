import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
    // Warn if chunk exceeds 600kb
    chunkSizeWarningLimit: 600,
  },
  // Proxy API ke backend saat development lokal
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/recaptcha': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
