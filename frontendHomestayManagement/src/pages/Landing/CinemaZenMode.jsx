import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './CinemaZenMode.css';
import { ZenAudioEngine } from './LandingAudioEngine';

const ZEN_SCENES = [
  {
    id: 'dawn',
    name: 'Bình Minh Biển Mây',
    subtitle: '1.650m • Thung Lũng Mường Hoa',
    icon: '🌅',
    bg: '/landing/images/rooftop/cinema_zen_balcony.jpg',
    colorTheme: '#fbbf24',
    teaCoords: { kettleX: 0.365, kettleY: 0.79, cupX: 0.30, cupY: 0.835 }
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn Tím Fansipan',
    subtitle: 'Nắng chiều buông rặng núi',
    icon: '🌄',
    bg: '/landing/images/rooftop/la_do_sunset.jpg',
    colorTheme: '#f97316',
    teaCoords: { kettleX: 0.365, kettleY: 0.79, cupX: 0.30, cupY: 0.835 }
  },
  {
    id: 'night',
    name: 'Đêm Trăng & Sao Sa Pa',
    subtitle: 'Trăng thanh & Gió ngàn 15°C',
    icon: '🌌',
    bg: '/landing/images/rooftop/la_do_night.jpg',
    colorTheme: '#60a5fa',
    teaCoords: { kettleX: 0.365, kettleY: 0.79, cupX: 0.30, cupY: 0.835 }
  },
  {
    id: 'mist',
    name: 'Rạng Đông Sương Mù',
    subtitle: 'Mây luồn qua khung cửa',
    icon: '☁️',
    bg: '/landing/images/rooftop/la_do_dawn.jpg',
    colorTheme: '#a7f3d0',
    teaCoords: { kettleX: 0.365, kettleY: 0.79, cupX: 0.30, cupY: 0.835 }
  }
];

const POETIC_QUOTES = [
  {
    line1: "Chạm tay vào mây ngàn,",
    line2: "gửi lòng vào khói sương...",
    author: "Lá Đỏ Sanctuary • 1.650m"
  },
  {
    line1: "Tách trà ấm bên khung cửa sương lạnh,",
    line2: "bình yên nằm lại giữa thung lũng mây.",
    author: "Bình Minh Sa Pa"
  },
  {
    line1: "Gió đại ngàn ru từng giấc ngủ say,",
    line2: "ngắm sao trời soi bóng ruộng bậc thang...",
    author: "Đêm Trăng Mù Sương"
  },
  {
    line1: "Lắng nghe thanh âm của núi rừng,",
    line2: "thả trôi muộn phiền vào hư không...",
    author: "Hoàng Hôn Tím Fansipan"
  }
];

const SOUND_LAYERS = [
  { id: 'cinematic', name: 'Nhạc Thiền Điện Ảnh', icon: '🎶', desc: '432Hz Hòa âm thiền định & chuông pha lê', type: 'procedural' },
  { id: 'breeze', name: 'Suối Rừng & Chuông Trúc', icon: '🌲', desc: 'Suối ngàn rì rào & chuông gió thanh tịnh', type: 'procedural' },
  { id: 'fire', name: 'Lửa Trại Đêm 15°C', icon: '🔥', desc: 'Gỗ thông tí tách ấm áp vùng cao', type: 'procedural' },
  { id: 'rain', name: 'Mưa Sương Sa Pa', icon: '🌧️', desc: 'Mưa phùn sương mờ trên mái hiên gỗ', type: 'procedural' }
];

export default function CinemaZenMode({ isOpen, onClose }) {
  const [currentSceneId, setCurrentSceneId] = useState('dawn');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [masterVolume, setMasterVolume] = useState(70);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [breathPhase, setBreathPhase] = useState('inhale'); // 'inhale' (4s) | 'hold' (7s) | 'exhale' (8s)
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound layer state for multi-track mixer
  const [layerStates, setLayerStates] = useState({
    cinematic: { active: true, volume: 75 },
    breeze: { active: true, volume: 60 },
    fire: { active: false, volume: 45 },
    rain: { active: false, volume: 45 }
  });

  // Mouse Parallax coordinates (smooth spring lerping)
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });
  const targetParallax = useRef({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const zenAudioRef = useRef(null);
  const idleTimerRef = useRef(null);
  const currentScene = useMemo(() => ZEN_SCENES.find(s => s.id === currentSceneId) || ZEN_SCENES[0], [currentSceneId]);

  // Cycle poetic quotes every 9 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % POETIC_QUOTES.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Keyboard listener: ESC to exit, F for fullscreen, B for breathwork
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'b' || e.key === 'B') {
        setIsBreathingOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-hide UI on idle mouse movement
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseMove = (e) => {
      setIsUiVisible(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsUiVisible(false);
      }, 5000);

      // Calculate normalized mouse parallax (-1 to 1)
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      targetParallax.current = { x: nx * 14, y: ny * 10 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    idleTimerRef.current = setTimeout(() => {
      setIsUiVisible(false);
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  // Smooth lerp mouse parallax frame loop
  useEffect(() => {
    if (!isOpen) return;
    let animId;
    const updateParallax = () => {
      setMouseParallax(prev => ({
        x: prev.x + (targetParallax.current.x - prev.x) * 0.05,
        y: prev.y + (targetParallax.current.y - prev.y) * 0.05,
      }));
      animId = requestAnimationFrame(updateParallax);
    };
    animId = requestAnimationFrame(updateParallax);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  // Fullscreen controller
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 4-7-8 Breathwork Timer Engine
  useEffect(() => {
    if (!isOpen || !isBreathingOpen) return;
    let phase = 'inhale';
    let timeLeft = 4;
    setBreathPhase('inhale');
    setBreathSeconds(4);

    const timer = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        if (phase === 'inhale') {
          phase = 'hold';
          timeLeft = 7;
        } else if (phase === 'hold') {
          phase = 'exhale';
          timeLeft = 8;
        } else {
          phase = 'inhale';
          timeLeft = 4;
        }
        setBreathPhase(phase);
      }
      setBreathSeconds(timeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isBreathingOpen]);

  // Handle Multi-Track High-Fidelity Generative Audio Playback
  useEffect(() => {
    if (!isOpen) {
      if (zenAudioRef.current) {
        zenAudioRef.current.stop();
      }
      return;
    }

    if (!zenAudioRef.current) {
      zenAudioRef.current = new ZenAudioEngine();
      window.__zenAudio = zenAudioRef.current;
    }

    const audio = zenAudioRef.current;
    const effectiveMaster = (masterVolume / 100);
    audio.setVolume(effectiveMaster);

    if (isPlaying) {
      audio.init();
      audio.setLayerActive('cinematic', Boolean(layerStates.cinematic?.active));
      audio.setLayerVolume('cinematic', (layerStates.cinematic?.volume || 75) / 100);

      audio.setLayerActive('breeze', Boolean(layerStates.breeze?.active));
      audio.setLayerVolume('breeze', (layerStates.breeze?.volume || 60) / 100);

      audio.setLayerActive('fire', Boolean(layerStates.fire?.active));
      audio.setLayerVolume('fire', (layerStates.fire?.volume || 45) / 100);

      audio.setLayerActive('rain', Boolean(layerStates.rain?.active));
      audio.setLayerVolume('rain', (layerStates.rain?.volume || 45) / 100);

      if (!audio.isPlaying) {
        audio.playAllActive();
      }
    } else {
      audio.stop();
    }

    return () => {
      if (zenAudioRef.current) {
        zenAudioRef.current.stop();
      }
    };
  }, [isOpen, isPlaying, masterVolume, layerStates]);

  const toggleLayer = (layerId) => {
    setLayerStates(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        active: !prev[layerId]?.active
      }
    }));
  };

  const setLayerVolume = (layerId, vol) => {
    setLayerStates(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        volume: vol
      }
    }));
  };

  // Canvas VFX Engine: Teapot Steam, Valley Mist Parallax, Falling Leaves, Glowing Fireflies, Rain Streaks
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // 1. Steam Particles (Billowing Warm Tea Steam from Kettle & Cup)
    const steamParticles = [];
    const maxSteam = 40;

    const createSteamParticle = (originX, originY, baseRadius = 5) => ({
      x: originX + (Math.random() - 0.5) * 6,
      y: originY + (Math.random() - 0.5) * 4,
      radius: baseRadius + Math.random() * 3,
      maxRadius: baseRadius * 4.5 + Math.random() * 12,
      growth: 0.18 + Math.random() * 0.12,
      speedY: -(0.55 + Math.random() * 0.75),
      speedX: 0.25 + Math.random() * 0.45, // Gentle drift to the right with mountain wind
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.03 + Math.random() * 0.02,
      alpha: 0.38 + Math.random() * 0.22,
      life: 1.0,
      decay: 0.007 + Math.random() * 0.006
    });

    // 2. Rain drops
    const rainDrops = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 16 + Math.random() * 8,
      length: 18 + Math.random() * 14
    }));

    // 3. Golden embers / Fireflies
    const embers = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -(0.3 + Math.random() * 0.7),
      alpha: 0.4 + Math.random() * 0.5,
      alphaSpeed: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2
    }));

    // 4. Soft falling autumn leaves
    const leaves = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 10 + Math.random() * 8,
      speedY: 0.8 + Math.random() * 1.1,
      speedX: 0.4 + Math.random() * 0.6,
      swaySpeed: 0.02 + Math.random() * 0.03,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      alpha: 0.65 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? '#e15241' : '#e67e22'
    }));

    let animationFrameId;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // --- B. Spawn & Render Warm Steaming Tea Kettle & Cup ---
      const coords = currentScene.teaCoords;
      const kettlePxX = width * coords.kettleX;
      const kettlePxY = height * coords.kettleY;
      const cupPxX = width * coords.cupX;
      const cupPxY = height * coords.cupY;

      if (tick % 4 === 0 && steamParticles.length < maxSteam) {
        // Spawn from kettle spout & cup
        steamParticles.push(createSteamParticle(kettlePxX, kettlePxY, 6));
        if (Math.random() > 0.3) {
          steamParticles.push(createSteamParticle(cupPxX, cupPxY, 4.5));
        }
      }

      for (let i = steamParticles.length - 1; i >= 0; i--) {
        const p = steamParticles[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          steamParticles.splice(i, 1);
          continue;
        }

        p.swayPhase += p.swaySpeed;
        p.x += p.speedX + Math.sin(p.swayPhase) * 0.45;
        p.y += p.speedY;
        p.radius = Math.min(p.maxRadius, p.radius + p.growth);

        ctx.save();
        ctx.beginPath();
        const currentAlpha = Math.max(0, p.alpha * Math.sin(p.life * Math.PI));
        const steamGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        steamGrad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha})`);
        steamGrad.addColorStop(0.5, `rgba(240, 245, 250, ${currentAlpha * 0.6})`);
        steamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = steamGrad;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- C. Render Rain Streaks (If rain layer active) ---
      if (layerStates.rain?.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 225, 255, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        rainDrops.forEach((d) => {
          d.y += d.speed;
          d.x += d.speed * 0.15; // Wind angle
          if (d.y > height) {
            d.y = -20;
            d.x = Math.random() * width;
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 4, d.y + d.length);
        });
        ctx.stroke();
        ctx.restore();
      }

      // --- D. Render Floating Fireflies / Golden Embers ---
      embers.forEach((f) => {
        f.x += f.speedX;
        f.y += f.speedY;
        f.phase += f.alphaSpeed;

        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;
        if (f.y < 0) f.y = height;
        if (f.y > height) f.y = 0;

        const currentAlpha = Math.max(0.15, Math.min(1, Math.sin(f.phase) * f.alpha));
        ctx.save();
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${currentAlpha})`;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
      });

      // Helper to draw realistic autumn leaves
      const drawLeaf = (context, size) => {
        context.beginPath();
        context.moveTo(0, -size);
        context.quadraticCurveTo(size * 0.7, -size * 0.3, size * 0.5, size * 0.5);
        context.quadraticCurveTo(0, size * 0.9, 0, size);
        context.quadraticCurveTo(0, size * 0.9, -size * 0.5, size * 0.5);
        context.quadraticCurveTo(-size * 0.7, -size * 0.3, 0, -size);
        context.fill();
      };

      // --- E. Render Soft Red Autumn Leaves ---
      leaves.forEach((l) => {
        l.y += l.speedY;
        l.swayPhase += l.swaySpeed;
        l.x += Math.sin(l.swayPhase) * 1.2 + l.speedX;
        l.rotation += l.rotSpeed;

        if (l.y > height + 60) {
          l.y = -50;
          l.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rotation);
        ctx.globalAlpha = l.alpha;
        ctx.fillStyle = l.color;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 10;
        drawLeaf(ctx, l.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, currentScene, layerStates.rain?.active]);

  if (!isOpen) return null;

  const quote = POETIC_QUOTES[currentQuoteIndex];

  return (
    <div className={`cinema-zen-overlay ${isUiVisible ? 'ui-active' : 'ui-idle'}`} role="dialog" aria-modal="true">
      {/* 4K Panoramic Balcony with Smooth 3D Mouse Parallax */}
      <div
        className="zen-backdrop-cinematic"
        style={{
          backgroundImage: `url('${currentScene.bg}')`,
          transform: `scale(1.06) translate3d(${-mouseParallax.x}px, ${-mouseParallax.y}px, 0)`
        }}
      >
        <div className="zen-vignette-layer" />
      </div>

      {/* Floating Canvas: Steam from Teapot, Valley Mist, Embers, Leaves, Rain */}
      <canvas
        ref={canvasRef}
        className="zen-ambient-canvas"
        style={{
          transform: `translate3d(${-mouseParallax.x * 0.4}px, ${-mouseParallax.y * 0.4}px, 0)`
        }}
      />

      {/* Top Left: Scene Selector Bar (4 Khoảnh Khắc Sa Pa) */}
      <div className="zen-top-left-scenes">
        <div className="zen-scene-pill-group">
          {ZEN_SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={`zen-scene-pill-btn ${currentSceneId === scene.id ? 'active' : ''}`}
              onClick={() => setCurrentSceneId(scene.id)}
              title={`${scene.name} (${scene.subtitle})`}
            >
              <span className="zen-scene-icon">{scene.icon}</span>
              <span className="zen-scene-label">{scene.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center Left: Poetic Typography */}
      <div
        className="zen-sky-content"
        style={{
          transform: `translate3d(${-mouseParallax.x * 0.7}px, ${-mouseParallax.y * 0.7}px, 0)`
        }}
      >
        <div className="zen-poetic-quote-box" key={currentQuoteIndex}>
          <p className="zen-quote-line-1">"{quote.line1}</p>
          <p className="zen-quote-line-2">{quote.line2}"</p>
          <span className="zen-quote-author">— {quote.author}</span>
        </div>
      </div>

      {/* Top Right Controls: Breathwork, Fullscreen, ESC */}
      <div className="zen-top-right-controls">
        <button
          type="button"
          className={`zen-glass-pill-btn ${isBreathingOpen ? 'active' : ''}`}
          onClick={() => setIsBreathingOpen(prev => !prev)}
          title="Tập thở thiền định 4-7-8 (Phím B)"
        >
          <span className="zen-pill-icon">🫁</span>
          <span>{isBreathingOpen ? 'Đang Thiền Thở' : 'Thở Thiền 4-7-8'}</span>
        </button>

        <button
          type="button"
          className="zen-glass-icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình (Phím F)'}
          aria-label="Toàn màn hình"
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" fill="none">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="zen-exit-pill-btn"
          onClick={onClose}
          title="Thoát Trải Nghiệm (Phím ESC)"
          aria-label="Thoát chế độ toàn màn hình"
        >
          <span className="zen-close-icon">✕</span>
          <span>Thoát</span>
        </button>
      </div>

      {/* 4-7-8 Breathwork Meditation Modal Overlay */}
      {isBreathingOpen && (
        <div className="zen-breathing-overlay">
          <div className={`zen-breathing-ring-wrapper ${breathPhase}`}>
            <div className="zen-breathing-ring-glow" />
            <div className="zen-breathing-ring-core">
              <span className="zen-breathing-action">
                {breathPhase === 'inhale' && 'Hít vào nhẹ nhàng...'}
                {breathPhase === 'hold' && 'Giữ hơi tĩnh lặng...'}
                {breathPhase === 'exhale' && 'Thở ra trút bỏ muộn phiền...'}
              </span>
              <span className="zen-breathing-seconds">{breathSeconds}s</span>
              <span className="zen-breathing-sub">Phương pháp 4-7-8 • An yên tâm trí</span>
            </div>
          </div>
          <button
            type="button"
            className="zen-breathing-close-btn"
            onClick={() => setIsBreathingOpen(false)}
          >
            ✕ Đóng bài thở
          </button>
        </div>
      )}

      {/* Bottom Right: Soundscape Mixer & Audio Player */}
      <div className="zen-bottom-right-player">
        <div className="zen-sound-card">
          <div className="zen-card-top-row">
            <button
              type="button"
              className={`zen-play-circle-btn ${isPlaying ? 'playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Tạm dừng tất cả' : 'Bật thanh âm núi rừng'}
              aria-label={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <div className="zen-now-playing-label">
              <span className="zen-sound-icon">🎛️</span>
              <span className="zen-sound-title">Hòa Âm Sa Pa Sanctuary</span>
            </div>

            <button
              type="button"
              className={`zen-mixer-toggle-btn ${isMixerOpen ? 'active' : ''}`}
              onClick={() => setIsMixerOpen(prev => !prev)}
              title="Mở Bộ Hòa Âm Đa Tầng (Mixer)"
            >
              <span>{isMixerOpen ? 'Thu gọn' : '🎚️ Mixer'}</span>
            </button>
          </div>

          {/* Soundwave Visualizer */}
          <div className={`zen-soundwave-row ${isPlaying ? 'animating' : ''}`}>
            {Array.from({ length: 26 }).map((_, i) => (
              <span
                key={i}
                className="sound-bar"
                style={{
                  animationDelay: `${(i * 0.05).toFixed(2)}s`,
                  height: isPlaying ? `${Math.max(15, Math.sin(i * 0.42) * 100)}%` : '4px'
                }}
              />
            ))}
          </div>

          {/* Sound Layer Chips (Quick Toggle) */}
          <div className="zen-track-switcher-row">
            {SOUND_LAYERS.map((layer) => {
              const active = Boolean(layerStates[layer.id]?.active);
              return (
                <button
                  key={layer.id}
                  type="button"
                  className={`zen-track-chip ${active ? 'active' : ''}`}
                  onClick={() => {
                    toggleLayer(layer.id);
                    if (!isPlaying) setIsPlaying(true);
                  }}
                  title={layer.desc}
                >
                  <span>{layer.icon}</span>
                  <span className="chip-text">{layer.name}</span>
                </button>
              );
            })}
          </div>

          {/* Expanded Soundscape Mixer Sliders */}
          {isMixerOpen && (
            <div className="zen-mixer-expanded-panel">
              <div className="zen-mixer-head">
                <span>🎚️ Bộ cân chỉnh âm lượng từng tầng</span>
              </div>
              <div className="zen-mixer-grid">
                {SOUND_LAYERS.map((layer) => {
                  const state = layerStates[layer.id] || { active: false, volume: 50 };
                  return (
                    <div className="zen-mixer-item" key={layer.id}>
                      <div className="zen-mixer-item-top">
                        <label className="zen-mixer-checkbox">
                          <input
                            type="checkbox"
                            checked={state.active}
                            onChange={() => toggleLayer(layer.id)}
                          />
                          <span>{layer.icon} {layer.name}</span>
                        </label>
                        <span className="zen-mixer-val">{state.volume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        disabled={!state.active}
                        value={state.volume}
                        onChange={(e) => setLayerVolume(layer.id, Number(e.target.value))}
                        className="zen-mixer-slider"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Master Volume */}
          <div className="zen-vol-slider-row">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="zen-range-input"
              title="Âm lượng tổng"
              aria-label="Âm lượng tổng"
            />
            <span className="zen-vol-text">{masterVolume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
