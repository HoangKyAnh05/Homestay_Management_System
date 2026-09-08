import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remotion-static-serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const cleanUrl = req.url.split('?')[0]
          if (cleanUrl === '/remotion-app') {
            const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : ''
            res.writeHead(301, { Location: '/remotion-app/' + query })
            return res.end()
          }
          if (cleanUrl === '/remotion-app/' || cleanUrl === '/remotion-app/index.html') {
            const indexPath = path.resolve(__dirname, 'public/remotion-app/index.html')
            if (fs.existsSync(indexPath)) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
              return fs.createReadStream(indexPath).pipe(res)
            }
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const cleanUrl = req.url.split('?')[0]
          if (cleanUrl === '/remotion-app') {
            const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : ''
            res.writeHead(301, { Location: '/remotion-app/' + query })
            return res.end()
          }
          if (cleanUrl === '/remotion-app/' || cleanUrl === '/remotion-app/index.html') {
            const indexPath = path.resolve(__dirname, 'dist/remotion-app/index.html')
            if (fs.existsSync(indexPath)) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
              return fs.createReadStream(indexPath).pipe(res)
            }
          }
          next()
        })
      },
    },
    {
      name: 'spa-fallback-landing',
      closeBundle() {
        try {
          const distDir = path.resolve(__dirname, 'dist')
          const indexHtml = path.join(distDir, 'index.html')
          const landingDir = path.join(distDir, 'landing')
          if (fs.existsSync(indexHtml) && fs.existsSync(landingDir)) {
            fs.copyFileSync(indexHtml, path.join(landingDir, 'index.html'))
          }
        } catch (err) {
          console.warn('[spa-fallback-landing] Could not copy index.html to dist/landing:', err)
        }
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

