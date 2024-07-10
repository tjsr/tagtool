import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
  server: {
    proxy: {
      '/^/(login|logout|session|debugHeaders|submit|tags).*': {
        changeOrigin: true,
        target: 'http://localhost:8280/(\\1)',
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
