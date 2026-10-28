import { defineConfig } from 'vite';

// In the Base44 sandbox the preview proxy reaches the dev server through
// <port>-<sandbox id>.<sandbox host domain>, and that id changes whenever the
// environment is recreated — so allow the whole domain as a wildcard instead of
// one exact host.
const previewMode = process.env.BASE44_PREVIEW_MODE === '1';
const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN;
const allowedHosts = previewMode && sandboxDomain ? ['.' + sandboxDomain] : [];

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts,
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
