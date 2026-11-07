import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || 'https://localhost:5000'
  const apiOrigin = new URL(apiUrl).origin
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${apiOrigin}`
  ].join('; ')
  // Vite injects the React refresh preamble and uses a WebSocket while developing.
  const developmentPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${apiOrigin} wss://localhost:5173`
  ].join('; ')
  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        'Content-Security-Policy': developmentPolicy,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      https: command === 'serve' ? {
        key: fs.readFileSync(path.resolve('..', 'server', 'certificates', 'localhost-key.pem')),
        cert: fs.readFileSync(path.resolve('..', 'server', 'certificates', 'localhost-cert.pem'))
      } : undefined
    },
    preview: {
      headers: {
        'Content-Security-Policy': policy,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  }
})
