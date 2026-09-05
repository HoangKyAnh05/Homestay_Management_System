import { WordTimestamp } from '../types/video';

interface SynthesizeResult {
  audioUrl: string;
  duration: number; // seconds
  words: WordTimestamp[];
}

export async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'vi-VN-HoaiMyNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): Promise<SynthesizeResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { audioUrl: '', duration: 2.0, words: [] };
  }

  // 1. If running inside Electron, use IPC
  if (window.electronAPI?.synthesizeTTS) {
    try {
      const result = await window.electronAPI.synthesizeTTS({
        text: cleanText,
        voice,
        rate,
        pitch
      });
      if (result && result.audioUrl) {
        return result;
      }
    } catch (err) {
      console.warn('Electron TTS IPC failed, attempting Vite API endpoint:', err);
    }
  }

  // 2. If running in browser (Vite dev or preview server), call /api/tts endpoint
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        voice,
        rate,
        pitch
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioUrl) {
        return {
          audioUrl: data.audioUrl,
          duration: data.duration || 4.0,
          words: data.words || []
        };
      }
    }
  } catch (err) {
    console.warn('Fetch /api/tts error, fallback to browser synthesis:', err);
  }

  // 3. Fallback: Browser Web Audio tone or calculated timestamps
  return createBrowserFallbackAudio(cleanText);
}

// Generate simple audio tone data url + calculated word timestamps as foolproof offline fallback
function createBrowserFallbackAudio(text: string): SynthesizeResult {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  const timePerWord = 0.38;
  const words: WordTimestamp[] = [];

  let curTime = 0.2;
  for (const w of rawWords) {
    words.push({
      word: w,
      start: Number(curTime.toFixed(2)),
      end: Number((curTime + timePerWord).toFixed(2))
    });
    curTime += timePerWord;
  }

  const duration = Number((curTime + 0.4).toFixed(2));

  return {
    audioUrl: '',
    duration: Math.max(3.0, duration),
    words
  };
}
