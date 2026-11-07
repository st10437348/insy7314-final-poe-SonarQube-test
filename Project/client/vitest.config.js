import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Separate test config so tests do not need the HTTPS certificates that vite.config.js loads.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/__tests__/**', 'src/test/**'],
      reporter: ['text', 'lcov']
    },
    env: {
      VITE_API_URL: 'https://localhost:5000'
    }
  }
})
