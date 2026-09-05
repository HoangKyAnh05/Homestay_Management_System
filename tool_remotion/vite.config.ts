import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { Communicate } from 'edge-tts-universal';

function ttsAndMediaApiPlugin(): Plugin {
  const handleTtsRequest = async (req: any, res: any) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = JSON.parse(body || '{}');
          const cleanText = (text || '').trim();
          if (!cleanText) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ audioUrl: '', duration: 2.0, words: [] }));
          }

          const comm = new Communicate(cleanText, { voice, rate, pitch });
          const words: Array<{ word: string; start: number; end: number }> = [];
          const audioChunks: Buffer[] = [];

          for await (const rawChunk of comm.stream()) {
            const chunk = rawChunk as any;
            if (chunk.type === 'audio' && chunk.data) {
              audioChunks.push(Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data));
            } else if (chunk.type === 'WordBoundary' && chunk.text) {
              const start = Number(((chunk.offset || 0) / 10000000).toFixed(2));
              const dur = Number(((chunk.duration || 0) / 10000000).toFixed(2));
              words.push({
                word: String(chunk.text),
                start,
                end: Number((start + dur).toFixed(2))
              });
            }
          }

          const fullBuffer = Buffer.concat(audioChunks);
          const base64 = fullBuffer.toString('base64');
          const audioUrl = `data:audio/mp3;base64,${base64}`;

          let duration = 3.0;
          if (words.length > 0) {
            duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
          } else {
            duration = Number(Math.max(2.5, fullBuffer.length / 5500).toFixed(2));
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ audioUrl, duration, words }));
        } catch (err: any) {
          console.error('Vite TTS plugin error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end();
    }
  };

  const handleMediaSearchRequest = async (req: any, res: any) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const query = urlObj.searchParams.get('q') || '';
      const cleanQuery = query.trim();

      if (!cleanQuery) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }

      const vqdRes = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&iax=images&ia=images`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          }
        }
      );
      const html = await vqdRes.text();
      const vqdMatch = html.match(/vqd=([\d-]+)/);
      if (!vqdMatch) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }

      const vqd = vqdMatch[1];
      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(cleanQuery)}&vqd=${vqd}&f=,,,`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            Referer: 'https://duckduckgo.com/'
          }
        }
      );
      const json = await imgRes.json();
      const results = (json.results || []).slice(0, 24).map((r: any, idx: number) => ({
        id: `web-img-${idx}-${Date.now()}`,
        type: 'image',
        url: r.image,
        thumbnail: r.thumbnail || r.image,
        title: r.title || cleanQuery,
        source: 'web'
      }));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results }));
    } catch (err: any) {
      console.error('Media search plugin error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: [] }));
    }
  };

  return {
    name: 'vite-tts-media-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
      server.middlewares.use('/api/search-media', handleMediaSearchRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
      server.middlewares.use('/api/search-media', handleMediaSearchRequest);
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    ttsAndMediaApiPlugin(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'ws',
                'edge-tts-universal',
                '@remotion/bundler',
                '@remotion/renderer'
              ]
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
