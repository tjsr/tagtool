import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';

// import svgrPlugin from 'vite-plugin-svgr';
// import viteTsconfigPaths from 'vite-tsconfig-paths';

const searchUpwardsForEnvFile = (): string => {
  let currentPath = __dirname;
  while (currentPath !== '/') {
    const envFilePath = path.join(currentPath, '.env.test');
    if (fs.existsSync(envFilePath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return '';
};

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
  test: {
    env: {
      DOTENV_FLOW_PATH: searchUpwardsForEnvFile(),
      DOTENV_FLOW_PATTERN: '.env.test',
    },
  },
});
