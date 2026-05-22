import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// L'URL de l'API — dans Docker le service s'appelle "api", en local c'est localhost
// VITE_API_URL peut être surchargé via docker-compose environment
const API_TARGET = process.env.VITE_API_URL || 'http://api:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        // Timeout généreux pour laisser Symfony démarrer
        proxyTimeout: 10000,
        timeout: 10000,
        // Log les erreurs proxy pour aider au debug
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy error]', req.method, req.url, err.message)
            // Renvoyer une vraie réponse JSON d'erreur au lieu du HTML de Vite
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'API indisponible — ' + err.message }))
            }
          })
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy]', req.method, req.url, '→', API_TARGET)
          })
        },
      },
    },
  },
})
