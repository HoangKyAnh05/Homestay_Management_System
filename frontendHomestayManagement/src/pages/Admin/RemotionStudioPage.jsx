import React, { useState, useRef, useEffect, useCallback } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import './RemotionStudioPage.css'

const REMOTION_LOCAL_URL = 'http://localhost:3000'
const REMOTION_DEPLOY_URL =
  import.meta.env.VITE_REMOTION_DEPLOY_URL || 'https://man-aqua-restaurant-cool.trycloudflare.com'

export default function RemotionStudioPage() {
  const isHttps =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'))

  const [activeMode, setActiveMode] = useState(isHttps ? 'deploy' : 'local')
  const [studioUrl, setStudioUrl] = useState(isHttps ? REMOTION_DEPLOY_URL : REMOTION_LOCAL_URL)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const iframeRef = useRef(null)
  const iframeLoaded = useRef(false)

  const verifyServer = useCallback(async (targetUrl = studioUrl) => {
    try {
      const res = await fetch(`${targetUrl}/health`, {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors',
      })
      if (res.ok) {
        setIsServerRunning(true)
        setIsChecking(false)
        if (iframeRef.current && (!iframeLoaded.current || iframeRef.current.src !== targetUrl)) {
          iframeRef.current.src = targetUrl
          iframeLoaded.current = true
        }
        return true
      }
    } catch {
      // Server not reachable yet
    }

    setIsServerRunning(false)
    setIsChecking(false)
    return false
  }, [studioUrl])

  // Continuous background auto-reconnect heartbeat
  useEffect(() => {
    verifyServer(studioUrl)
    const interval = setInterval(() => {
      verifyServer(studioUrl)
    }, 4000)
    return () => clearInterval(interval)
  }, [verifyServer, studioUrl])

  const handleSwitchMode = (mode) => {
    setActiveMode(mode)
    const newUrl = mode === 'deploy' ? REMOTION_DEPLOY_URL : REMOTION_LOCAL_URL
    setStudioUrl(newUrl)
    setIsChecking(true)
    iframeLoaded.current = false
    verifyServer(newUrl)
  }

  const handleRefresh = () => {
    setIsChecking(true)
    iframeLoaded.current = false
    verifyServer(studioUrl)
  }

  const handleOpenStandalone = (url = studioUrl) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleGoToPublish = () => {
    navigate('/admin/marketing/ai-agent')
  }

  return (
    <AdminLayout activePage="remotion-studio">
      <div className={`remotion-studio-page ${isFullscreen ? 'remotion-studio-page--fullscreen' : ''}`}>
        {/* Studio Top Header Bar */}
        <div className="remotion-studio-header">
          <div className="remotion-studio-header-left">
            <div className="remotion-studio-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 className="remotion-studio-title">Studio Biên Tập Video Lá Đỏ Homestay</h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isServerRunning ? '#ecfdf5' : '#fef2f2',
                    color: isServerRunning ? '#059669' : '#dc2626',
                    border: `1px solid ${isServerRunning ? '#a7f3d0' : '#fecaca'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isServerRunning ? '#10b981' : '#ef4444',
                    }}
                  />
                  {isServerRunning
                    ? `Studio Online (${activeMode === 'deploy' ? 'Cloudflare Deploy' : ':3000'})`
                    : 'Đang kết nối...'}
                </span>

                {/* Switcher Mode: Deploy vs Localhost */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    padding: '2px',
                    borderRadius: '8px',
                    gap: '2px',
                    fontSize: '11px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('deploy')}
                    style={{
                      border: 'none',
                      background: activeMode === 'deploy' ? '#2563eb' : 'transparent',
                      color: activeMode === 'deploy' ? '#ffffff' : '#64748b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Dùng link Cloudflare HTTPS đã deploy công khai"
                  >
                    🌐 Cloudflare Deploy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('local')}
                    style={{
                      border: 'none',
                      background: activeMode === 'local' ? '#2563eb' : 'transparent',
                      color: activeMode === 'local' ? '#ffffff' : '#64748b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Dùng link nội bộ máy tính http://localhost:3000"
                  >
                    💻 Localhost:3000
                  </button>
                </div>
              </div>
              <p className="remotion-studio-subtitle">
                Biên tập phân cảnh, lồng tiếng thuyết minh tiếng Việt & xuất bản video marketing Homestay đa nền tảng.
              </p>
            </div>
          </div>

          <div className="remotion-studio-header-actions">
            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--secondary"
              onClick={() => handleOpenStandalone(studioUrl)}
              title="Mở Studio trong tab riêng không giới hạn iframe"
              style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Mở Tab Riêng</span>
            </button>

            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--secondary"
              onClick={handleRefresh}
              title="Tải lại trình biên tập"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--secondary"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>

            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--primary"
              onClick={handleGoToPublish}
              title="Chuyển sang đăng tải bài viết lên Facebook / YouTube"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              <span>Đăng Lên Fanpage / Kênh</span>
            </button>
          </div>
        </div>

        {/* Studio Embedded Workspace */}
        <div className="remotion-studio-workspace">
          <iframe
            ref={iframeRef}
            src={studioUrl}
            title="Remotion Video Auto Editor Studio"
            className="remotion-studio-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
          />

          {isChecking && !isServerRunning && (
            <div className="remotion-studio-error-overlay">
              <div className="remotion-studio-loading-card">
                <div className="remotion-spinner" />
                <p style={{ marginTop: '12px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                  Đang kết nối Remotion Video Studio ({activeMode === 'deploy' ? 'Cloudflare Deploy' : ':3000'})...
                </p>
              </div>
            </div>
          )}

          {!isChecking && !isServerRunning && (
            <div className="remotion-studio-error-overlay">
              <div
                className="remotion-studio-error-card"
                style={{ maxWidth: '520px', padding: '28px', textAlign: 'center' }}
              >
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🎬</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  {activeMode === 'deploy'
                    ? 'Remotion Studio Deploy (Cloudflare)'
                    : 'Chưa kết nối được với Remotion Server (:3000)'}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '18px' }}>
                  {isHttps
                    ? 'Bạn đang truy cập qua link deploy HTTPS. Để trải nghiệm video studio mượt mà và bảo đảm quyền truy cập từ xa, hãy chọn mở qua link Deploy Cloudflare bên dưới:'
                    : 'Máy chủ Remotion đang khởi động hoặc chưa bật. Bạn có thể chọn mở tab riêng hoặc kết nối lại.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenStandalone(REMOTION_DEPLOY_URL)}
                    className="remotion-action-btn remotion-action-btn--primary"
                    style={{ padding: '9px 18px', fontSize: '13.5px' }}
                    title="Mở link deploy Cloudflare trực tiếp trên tab mới"
                  >
                    🚀 Mở Remotion Studio (Deploy Cloudflare)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenStandalone(REMOTION_LOCAL_URL)}
                    className="remotion-action-btn remotion-action-btn--secondary"
                    style={{ padding: '9px 14px', fontSize: '13.5px' }}
                    title="Mở localhost:3000 trên máy của bạn"
                  >
                    💻 Mở Localhost:3000
                  </button>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="remotion-action-btn remotion-action-btn--secondary"
                    style={{ padding: '9px 14px', fontSize: '13.5px' }}
                  >
                    🔄 Thử kết nối lại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
