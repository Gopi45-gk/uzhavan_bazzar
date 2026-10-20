import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8008',
          changeOrigin: true,
        },
        '/health': {
          target: process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8008',
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/ml_env/**',
          '**/ml/**',
          '**/dataset/**',
          '**/Unified_Dataset/**',
          '**/train/**',
          '**/test/**',
          '**/valid/**',
          '**/models/**',
          '**/dist/**',
          '**/Uzhavan_Bazaar/**',
          '**/uzhavan-bazzar/**',
          '**/vegetable/**',
          '**/.next/**',
          '**/.git/**',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.png',
        ],
      },
    },
  };
});
