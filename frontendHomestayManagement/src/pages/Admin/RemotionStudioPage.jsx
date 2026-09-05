import React, { useState, useRef, useEffect, useCallback } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import './RemotionStudioPage.css'

export default function RemotionStudioPage() {
  const [studioUrl, setStudioUrl] = useState('http://localhost:3000')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isServerRunning, setIsServerRunning] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const iframeRef = useRef(null)

  const verifyServer = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch('http://localhost:3000/health', {
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors'
      })
      if (res.ok) {
        setIsServerRunning(true)
        setIsChecking(false)
        if (iframeRef.current) {
          iframeRef.current.src = `${studioUrl}?t=${Date.now()}`
        }
        return true
      }
    } catch {
      // Server not ready yet
    }

    if (retryCount < 5) {
      setTimeout(() => verifyServer(retryCount + 1), 1200)
    } else {
      setIsServerRunning(false)
      setIsChecking(false)
    }
    return false
  }, [studioUrl])

  useEffect(() => {
    verifyServer()
  }, [verifyServer])

  const handleRefresh = () => {
    setIsChecking(true)
    verifyServer(0)
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
              <h1 className="remotion-studio-title">Studio Biên Tập Video Lá Đỏ Homestay</h1>
              <p className="remotion-studio-subtitle">
                Biên tập phân cảnh, lồng tiếng thuyết minh tiếng Việt & xuất bản video marketing Homestay đa nền tảng.
              </p>
            </div>
          </div>

          <div className="remotion-studio-header-actions">
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
              <span>Làm mới Studio</span>
            </button>

            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--secondary"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </>
                ) : (
                  <>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </>
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
            onError={() => setIsServerRunning(false)}
          />

          {isChecking && (
            <div className="remotion-studio-error-overlay">
              <div className="remotion-studio-loading-card">
                <div className="remotion-spinner" />
                <p style={{ marginTop: '12px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                  Đang kết nối Remotion Video Studio (:3000)...
                </p>
              </div>
            </div>
          )}

          {!isChecking && !isServerRunning && (
            <div className="remotion-studio-error-overlay">
              <div className="remotion-studio-error-card">
                <h3>⚠️ Chưa kết nối được với Remotion Server (:3000)</h3>
                <p>Vui lòng đảm bảo tiến trình <code>node server.mjs</code> trong <code>tool_remotion</code> đang hoạt động.</p>
                <button type="button" onClick={handleRefresh} className="remotion-action-btn remotion-action-btn--primary">
                  Thử kết nối lại
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  )
}
