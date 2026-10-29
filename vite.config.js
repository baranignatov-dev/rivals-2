import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Base44 sandbox proxies the dev server through a per-sandbox hostname.
// Only extend the allowlist inside the preview sandbox; normal dev keeps
// Vite's default (localhost only) behaviour.
const previewMode = process.env.BASE44_PREVIEW_MODE === '1'
const sandboxHostDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: previewMode && sandboxHostDomain ? [`.${sandboxHostDomain}`] : [],
    ...(previewMode ? { hmr: { protocol: 'wss', clientPort: 443 } } : {}),
  },
})
