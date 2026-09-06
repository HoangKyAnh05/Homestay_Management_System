import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remotion-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/remotion-app') {
            res.writeHead(301, { Location: '/remotion-app/' })
            return res.end()
          }
          next()
        })
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api/tts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/remotion-health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      '/remotion-app': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/remotion-app/, '') || '/',
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/invoive': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/exports': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/tts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/remotion-health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      '/remotion-app': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/remotion-app/, '') || '/',
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/invoive': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/exports': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

