import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { Agent } from 'node:https'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const demo = process.env.ECOMM_DEMO_MODE === 'true'
const assets = process.env.ECOMM_DEMO_DIR || fileURLToPath(new URL('../.demo', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { ...Object.fromEntries(['/api', '/accounts', '/admin', '/static'].map(path => [path, {
      target: process.env.BACKEND_URL || 'http://127.0.0.1:8002',
      changeOrigin: false,
    }])), ...(demo ? { '/demo-provider': {
      target: `https://127.0.0.1:${process.env.ECOMM_DEMO_PROVIDER_PORT || '9443'}`,
      agent: new Agent({ ca: readFileSync(resolve(assets, 'ca.pem')) }), changeOrigin: false,
    } } : {}) },
  },
})

