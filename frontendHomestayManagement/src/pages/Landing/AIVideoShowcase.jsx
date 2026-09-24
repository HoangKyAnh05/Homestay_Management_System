import React, { useState, useEffect, useRef } from 'react';
import './AIVideoShowcase.css';

// Default AI video presets (clean, direct video links)
const PRESET_VIDEOS = [
  {
    id: 'preset-web-sim',
    title: 'Mô Phỏng Hệ Thống Quản Lý & Trải Nghiệm Khách Hàng AI',
    desc: 'Video AI mô phỏng toàn bộ quy trình đặt phòng 3D, chọn villa, giữ chỗ realtime và hệ thống quản trị vận hành thông minh Lá Đỏ.',
    tag: 'AI SYSTEM TOUR',
    duration: '02:45',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: '✨ PHIÊN BẢN AI 2026'
  },
  {
    id: 'preset-cloud-hunt',
    title: 'Toàn Cảnh Săn Mây & Khung Cảnh Thung Lũng Mường Hoa 4K',
    desc: 'Mô phỏng góc nhìn 360 độ từ ban công gỗ Lá Đỏ Homestay nhìn ra biển mây bồng bềnh và dãy Hoàng Liên Sơn hùng vĩ.',
    tag: 'AI PANORAMA 4K',
    duration: '01:30',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: '☁️ SĂN MÂY 4K'
  },
  {
    id: 'preset-villa-3d',
    title: 'Khám Phá Chi Tiết Không Gian Villa & Phòng Nghỉ 3D',
    desc: 'Trải nghiệm không gian kiến trúc gỗ mộc mạc, tiện nghi hiện đại và góc check-in tuyệt đẹp của từng căn phòng.',
    tag: '3D VIRTUAL TOUR',
    duration: '02:10',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    badge: '🏡 TOUR PHÒNG 3D'
  }
];

const LOCAL_STORAGE_KEY = 'la_do_ai_showcase_video_config';
const LOCAL_STORAGE_THUMB_KEY = 'la_do_ai_showcase_video_thumbnail';

// IndexedDB configuration for persistent video storage
const DB_NAME = 'LaDoHomestayVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function saveVideoFileToDB(file) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, 'uploaded_ai_video');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save error:', err);
    return false;
  }
}

async function getVideoFileFromDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('uploaded_ai_video');
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB get error:', err);
    return null;
  }
}

async function clearVideoFileFromDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('uploaded_ai_video');
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }
}

// Function to extract first frame thumbnail from video file / blob
function extractFirstFrameThumbnail(fileOrBlob) {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const tempUrl = URL.createObjectURL(fileOrBlob);
      video.src = tempUrl;

      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(tempUrl);
          resolve(dataUrl);
        } catch (e) {
          URL.revokeObjectURL(tempUrl);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

// Maple Leaf SVG Component
function MapleLeafSVG({ size = 52, fill = 'url(#leafGradRed)', opacity = 0.95, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`maple-leaf-svg ${className}`}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id="leafGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="leafGradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <filter id="leafGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7f1d1d" floodOpacity="0.8" />
        </filter>
      </defs>
      <path
        d="M50 5 C52 18, 56 22, 63 18 C64 25, 69 28, 77 24 C75 32, 80 37, 90 35 C83 43, 85 49, 93 54 C83 58, 81 65, 83 74 C75 70, 71 74, 68 83 C63 76, 58 78, 54 86 C53 89, 52 94, 52 98 L48 98 C48 94, 47 89, 46 86 C42 78, 37 76, 32 83 C29 74, 25 70, 17 74 C19 65, 17 58, 7 54 C15 49, 17 43, 10 35 C20 37, 25 32, 23 24 C31 28, 36 25, 37 18 C44 22, 48 18, 50 5 Z"
        fill={fill}
        filter="url(#leafGlow)"
      />
      <path
        d="M50 90 L50 20 M50 70 L70 50 M50 70 L30 50 M50 55 L75 38 M50 55 L25 38 M50 40 L65 25 M50 40 L35 25"
        stroke="rgba(255, 230, 200, 0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export default function AIVideoShowcase() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  // Video configuration state
  const [videoConfig, setVideoConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load saved video config', e);
    }
    return {
      type: 'preset',
      url: PRESET_VIDEOS[0].url,
      title: PRESET_VIDEOS[0].title,
      desc: PRESET_VIDEOS[0].desc,
      badge: PRESET_VIDEOS[0].badge,
      loop: true,
      autoPlay: true
    };
  });

  const [videoThumbnail, setVideoThumbnail] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_THUMB_KEY) || null;
    } catch {
      return null;
    }
  });

  // Modal manager state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('upload');
  const [inputUrl, setInputUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [tempFileBlob, setTempFileBlob] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Helper to detect youtube URL
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1` : url;
    } catch {
      return url;
    }
  };

  // On component mount, restore uploaded video file from IndexedDB so reload preserves it!
  useEffect(() => {
    async function restoreUploadedVideo() {
      try {
        const savedMetaStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedMetaStr) {
          const savedMeta = JSON.parse(savedMetaStr);
          if (savedMeta.type === 'file') {
            const fileBlob = await getVideoFileFromDB();
            if (fileBlob) {
              const freshUrl = URL.createObjectURL(fileBlob);
              setVideoConfig((prev) => ({
                ...prev,
                ...savedMeta,
                url: freshUrl
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Error restoring video from IndexedDB:', err);
      }
    }
    restoreUploadedVideo();
  }, []);

  // Auto-play when scrolled into view, pause when scrolled out of view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTubeUrl(videoConfig.url)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = isMuted;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch((err) => console.warn('Autoplay on scroll:', err));
            }
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [videoConfig.url, isMuted]);

  const togglePlay = () => {
    if (isYouTubeUrl(videoConfig.url)) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  // Fullscreen change listener to guarantee state synchronization on ESC / gesture exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const changePlaybackRate = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    const isFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (!isFs) {
      const elem = playerContainerRef.current;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err) => console.warn(err));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.warn(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn một file video hợp lệ (MP4, WebM, MOV, v.v.)');
      return;
    }

    setTempFileBlob(file);
    setUploadedFileName(file.name);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Auto extract first frame thumbnail
    const thumbDataUrl = await extractFirstFrameThumbnail(file);
    if (thumbDataUrl) {
      setVideoThumbnail(thumbDataUrl);
    }
  };

  const handleSaveConfig = async () => {
    if (modalTab === 'upload') {
      if (!tempFileBlob) {
        alert('Vui lòng chọn file video từ máy tính của bạn!');
        return;
      }

      // Save file permanently in IndexedDB
      await saveVideoFileToDB(tempFileBlob);
      const freshUrl = URL.createObjectURL(tempFileBlob);

      // Extract thumbnail
      const thumbDataUrl = await extractFirstFrameThumbnail(tempFileBlob);
      if (thumbDataUrl) {
        setVideoThumbnail(thumbDataUrl);
        try {
          localStorage.setItem(LOCAL_STORAGE_THUMB_KEY, thumbDataUrl);
        } catch (e) {}
      }

      const metaConfig = {
        type: 'file',
        url: freshUrl,
        title: customTitle || 'Video AI Mô Phỏng Web (Tải Lên)',
        desc: customDesc || 'Video demo hệ thống do quản trị viên tải lên từ máy tính.',
        badge: '⚡ VIDEO TỰ TẢI LÊN',
        loop: true,
        autoPlay: true
      };

      setVideoConfig(metaConfig);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          type: 'file',
          title: metaConfig.title,
          desc: metaConfig.desc,
          badge: metaConfig.badge,
          loop: true,
          autoPlay: true
        }));
      } catch (err) {
        console.warn('Storage error:', err);
      }

    } else if (modalTab === 'url') {
      if (!inputUrl || !inputUrl.trim()) {
        alert('Vui lòng nhập đường link Video (MP4, WebM hoặc link YouTube)!');
        return;
      }

      await clearVideoFileFromDB();

      const newConfig = {
        type: 'url',
        url: inputUrl.trim(),
        title: customTitle || 'Video AI Giới Thiệu Hệ Thống',
        desc: customDesc || 'Video demo trải nghiệm mô phỏng từ nguồn trực tuyến.',
        badge: isYouTubeUrl(inputUrl) ? '▶️ YOUTUBE STREAM' : '🌐 VIDEO ONLINE',
        loop: true,
        autoPlay: true
      };

      setVideoConfig(newConfig);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
        localStorage.removeItem(LOCAL_STORAGE_THUMB_KEY);
      } catch (err) {
        console.warn('Storage error:', err);
      }
    }

    setSaveSuccessMsg('✅ Đã lưu và tự động ghi nhớ video thành công!');
    setTimeout(() => {
      setSaveSuccessMsg('');
      setIsModalOpen(false);
      if (videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 1000);
  };

  const handleSelectPreset = async (preset) => {
    await clearVideoFileFromDB();
    const newConfig = {
      type: 'preset',
      url: preset.url,
      title: preset.title,
      desc: preset.desc,
      badge: preset.badge,
      loop: true,
      autoPlay: true
    };
    setVideoConfig(newConfig);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
      localStorage.removeItem(LOCAL_STORAGE_THUMB_KEY);
    } catch (e) {}
    setIsModalOpen(false);
  };

  const handleResetDefault = async () => {
    await clearVideoFileFromDB();
    const defaultConfig = {
      type: 'preset',
      url: PRESET_VIDEOS[0].url,
      title: PRESET_VIDEOS[0].title,
      desc: PRESET_VIDEOS[0].desc,
      badge: PRESET_VIDEOS[0].badge,
      loop: true,
      autoPlay: true
    };
    setVideoConfig(defaultConfig);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_THUMB_KEY);
    setIsModalOpen(false);
  };

  const isEmbed = isYouTubeUrl(videoConfig.url);

  return (
    <section className="ai-video-showcase-section" id="ai-video-showcase" ref={containerRef}>
      <div className="ai-showcase-container">
        {/* Floating Upload/Change Video Button */}
        <div className="ai-floating-upload-bar">
          <button
            type="button"
            className="ai-floating-upload-btn"
            onClick={() => {
              setCustomTitle(videoConfig.title);
              setCustomDesc(videoConfig.desc);
              if (videoConfig.type === 'url') setInputUrl(videoConfig.url);
              setIsModalOpen(true);
            }}
            title="Nhấn để tải lên video AI của bạn hoặc đổi video mô phỏng"
          >
            <span className="btn-leaf-icon">🍁</span>
            <span>Đẩy Video AI Lên / Đổi Video</span>
            <svg className="btn-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        </div>

        {/* Video Wrapper with Red Leaf Frame Border (Full Width) */}
        <div className="ai-leaf-framed-container">
          {/* Top-Left Leaf Cluster */}
          <div className="leaf-cluster cluster-top-left">
            <MapleLeafSVG size={76} fill="url(#leafGradRed)" className="leaf-main leaf-tl-1" />
            <MapleLeafSVG size={58} fill="url(#leafGradOrange)" className="leaf-sub leaf-tl-2" />
            <MapleLeafSVG size={44} fill="#b91c1c" className="leaf-sub leaf-tl-3" />
            <MapleLeafSVG size={36} fill="#ea580c" className="leaf-sub leaf-tl-4" />
          </div>

          {/* Top-Right Leaf Cluster */}
          <div className="leaf-cluster cluster-top-right">
            <MapleLeafSVG size={80} fill="url(#leafGradRed)" className="leaf-main leaf-tr-1" />
            <MapleLeafSVG size={60} fill="url(#leafGradOrange)" className="leaf-sub leaf-tr-2" />
            <MapleLeafSVG size={44} fill="#991b1b" className="leaf-sub leaf-tr-3" />
            <MapleLeafSVG size={34} fill="#f59e0b" className="leaf-sub leaf-tr-4" />
          </div>

          {/* Bottom-Left Leaf Cluster */}
          <div className="leaf-cluster cluster-bottom-left">
            <MapleLeafSVG size={72} fill="url(#leafGradRed)" className="leaf-main leaf-bl-1" />
            <MapleLeafSVG size={54} fill="url(#leafGradOrange)" className="leaf-sub leaf-bl-2" />
            <MapleLeafSVG size={42} fill="#b91c1c" className="leaf-sub leaf-bl-3" />
            <MapleLeafSVG size={32} fill="#dc2626" className="leaf-sub leaf-bl-4" />
          </div>

          {/* Bottom-Right Leaf Cluster */}
          <div className="leaf-cluster cluster-bottom-right">
            <MapleLeafSVG size={78} fill="url(#leafGradRed)" className="leaf-main leaf-br-1" />
            <MapleLeafSVG size={56} fill="url(#leafGradOrange)" className="leaf-sub leaf-br-2" />
            <MapleLeafSVG size={46} fill="#991b1b" className="leaf-sub leaf-br-3" />
            <MapleLeafSVG size={36} fill="#ea580c" className="leaf-sub leaf-br-4" />
          </div>

          {/* Top Edge Leaf Vine Sprigs */}
          <div className="leaf-vine-top">
            <span className="vine-leaf vl-1">🍁</span>
            <span className="vine-leaf vl-2">🍂</span>
            <span className="vine-leaf vl-3">🍁</span>
            <span className="vine-leaf vl-4">🍁</span>
            <span className="vine-leaf vl-5">🍂</span>
            <span className="vine-leaf vl-6">🍁</span>
            <span className="vine-leaf vl-1">🍂</span>
            <span className="vine-leaf vl-4">🍁</span>
          </div>

          {/* Bottom Edge Leaf Vine Sprigs */}
          <div className="leaf-vine-bottom">
            <span className="vine-leaf vl-7">🍁</span>
            <span className="vine-leaf vl-8">🍂</span>
            <span className="vine-leaf vl-9">🍁</span>
            <span className="vine-leaf vl-10">🍂</span>
            <span className="vine-leaf vl-11">🍁</span>
            <span className="vine-leaf vl-7">🍂</span>
            <span className="vine-leaf vl-9">🍁</span>
          </div>

          {/* Left and Right Side Vines */}
          <div className="leaf-vine-left">
            <span className="vine-leaf vl-side-1">🍁</span>
            <span className="vine-leaf vl-side-2">🍂</span>
            <span className="vine-leaf vl-side-3">🍁</span>
            <span className="vine-leaf vl-side-2">🍂</span>
          </div>
          <div className="leaf-vine-right">
            <span className="vine-leaf vl-side-4">🍁</span>
            <span className="vine-leaf vl-side-5">🍂</span>
            <span className="vine-leaf vl-side-6">🍁</span>
            <span className="vine-leaf vl-side-5">🍂</span>
          </div>

          {/* Main Cinematic Video Player (Uses first frame as poster / seamless stream) */}
          <div
            className={`ai-player-viewport ${isFullscreen ? 'fullscreen' : ''}`}
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Video Element or YouTube Iframe */}
            {isEmbed ? (
              <iframe
                className="ai-iframe-player"
                src={getYouTubeEmbedUrl(videoConfig.url)}
                title={videoConfig.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                className="ai-html5-video"
                src={videoConfig.url}
                poster={videoThumbnail || undefined}
                loop={true}
                muted={isMuted}
                autoPlay={true}
                playsInline={true}
                preload="metadata"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                  }
                }}
              />
            )}

            {/* Center Play/Pause Ripple Button */}
            {!isEmbed && (
              <div
                className={`ai-center-play-overlay ${!isPlaying ? 'show' : ''}`}
                onClick={togglePlay}
              >
                <div className="ai-play-ripple-ring" />
                <button
                  type="button"
                  className="ai-center-play-btn"
                  aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video AI'}
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Custom Bottom Video Controls */}
            {!isEmbed && (
              <div className={`ai-player-bottom-bar ${showControls || !isPlaying ? 'visible' : 'hidden'}`}>
                {/* Progress Bar / Scrubber */}
                <div className="ai-scrubber-track">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="ai-scrubber-input"
                    aria-label="Tua thời gian video"
                  />
                  <div
                    className="ai-scrubber-filled"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>

                <div className="ai-controls-row">
                  <div className="ai-controls-left">
                    <button
                      type="button"
                      className="ai-control-btn"
                      onClick={togglePlay}
                      title={isPlaying ? 'Tạm dừng (Space)' : 'Phát video (Space)'}
                    >
                      {isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    <div className="ai-volume-box">
                      <button
                        type="button"
                        className="ai-control-btn"
                        onClick={toggleMute}
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                      >
                        {isMuted || volume === 0 ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="ai-volume-slider"
                        aria-label="Âm lượng"
                      />
                    </div>

                    <div className="ai-time-display">
                      <span>{formatTime(currentTime)}</span>
                      <span className="time-divider">/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="ai-controls-right">
                    <div className="ai-speed-selector">
                      {[1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          className={`ai-speed-btn ${playbackRate === rate ? 'active' : ''}`}
                          onClick={() => changePlaybackRate(rate)}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="ai-control-btn"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? 'Thu nhỏ (ESC)' : 'Toàn màn hình (F)'}
                    >
                      {isFullscreen ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Tải Lên / Đẩy Video AI Mới */}
      {isModalOpen && (
        <div className="ai-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="ai-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div className="ai-modal-title-box">
                <div className="ai-modal-badge">🍁 LÁ ĐỎ HOMESTAY • AI VIDEO</div>
                <h3>Đẩy Video AI Lên / Thay Đổi Video</h3>
              </div>
              <button
                type="button"
                className="ai-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="ai-modal-tabs">
              <button
                type="button"
                className={`ai-tab-btn ${modalTab === 'upload' ? 'active' : ''}`}
                onClick={() => setModalTab('upload')}
              >
                📁 Tải File Từ Máy Tính
              </button>
              <button
                type="button"
                className={`ai-tab-btn ${modalTab === 'url' ? 'active' : ''}`}
                onClick={() => setModalTab('url')}
              >
                🌐 Nhập Link Video Online
              </button>
              <button
                type="button"
                className={`ai-tab-btn ${modalTab === 'presets' ? 'active' : ''}`}
                onClick={() => setModalTab('presets')}
              >
                🎬 Video AI Mẫu Có Sẵn
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="ai-modal-body">
              {modalTab === 'upload' && (
                <div className="tab-upload-pane">
                  <div className="ai-dropzone">
                    <input
                      type="file"
                      id="ai-video-file-input"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="ai-hidden-file-input"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="ai-video-file-input" className="ai-dropzone-label">
                      <div className="dropzone-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <span className="dropzone-title">
                        {uploadedFileName ? `Đã chọn: ${uploadedFileName}` : 'Kéo thả file video AI vào đây, hoặc nhấn để duyệt file'}
                      </span>
                      <span className="dropzone-sub">
                        Hỗ trợ MP4, WebM, MOV. Hệ thống tự động trích xuất khung hình đầu làm thumbnail và lưu trữ vĩnh viễn trên trình duyệt!
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {modalTab === 'url' && (
                <div className="tab-url-pane">
                  <label className="ai-input-label">
                    Đường Link Video AI (Direct MP4 / WebM / Link YouTube / Google Drive):
                  </label>
                  <input
                    type="text"
                    className="ai-text-input"
                    placeholder="Ví dụ: https://example.com/my-ai-video.mp4 hoặc https://youtu.be/..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <p className="ai-input-hint">
                    💡 Hỗ trợ link video MP4 trực tiếp hoặc đường link YouTube (hệ thống sẽ tự động chuyển thành khung phát chuẩn 4K).
                  </p>
                </div>
              )}

              {modalTab === 'presets' && (
                <div className="tab-presets-pane">
                  <div className="presets-list">
                    {PRESET_VIDEOS.map((p) => (
                      <div
                        key={p.id}
                        className={`preset-item-card ${videoConfig.url === p.url ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(p)}
                      >
                        <div className="preset-item-info">
                          <h4>{p.title}</h4>
                          <p>{p.desc}</p>
                          <span className="preset-duration">Thời lượng: {p.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveSuccessMsg && (
                <div className="ai-save-alert-box">
                  {saveSuccessMsg}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="ai-modal-footer">
              <button
                type="button"
                className="ai-modal-btn-reset"
                onClick={handleResetDefault}
              >
                🔄 Khôi phục video mặc định
              </button>

              <div className="ai-modal-footer-right">
                <button
                  type="button"
                  className="ai-modal-btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                {modalTab !== 'presets' && (
                  <button
                    type="button"
                    className="ai-modal-btn-save"
                    onClick={handleSaveConfig}
                  >
                    🚀 Áp Dụng Video Này
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
