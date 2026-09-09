import React, { useEffect, useRef } from 'react'
import AdminLayout, { navigate } from './AdminLayout'
import './RemotionStudioPage.css'

const REMOTION_LOCAL_URL = 'http://localhost:3000'

export default function RemotionStudioPage() {
  const hasAutoOpened = useRef(false)

  const getDeployUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/remotion-app/index.html`
    }
    return '/remotion-app/index.html'
  }

  // Tự động mở tab riêng khi truy cập vào trang (chỉ trigger 1 lần)
  useEffect(() => {
    if (!hasAutoOpened.current) {
      hasAutoOpened.current = true
      try {
        window.open(getDeployUrl(), '_blank')
      } catch (e) {
        // Fallback if blocked by browser popup
      }
    }
  }, [])

  const handleOpenTab = (url = getDeployUrl()) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleGoToPublish = () => {
    navigate('/admin/marketing/ai-agent')
  }

  return (
    <AdminLayout activePage="remotion-studio">
      <div className="remotion-studio-page">
        {/* Top Header Bar */}
        <div className="remotion-studio-header">
          <div className="remotion-studio-header-left">
            <div className="remotion-studio-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <h1 className="remotion-studio-title">Studio Biên Tập Video Remotion Lá Đỏ</h1>
                <span className="remotion-status-pill">
                  <span className="remotion-status-dot" />
                  Không gian làm việc Tab Độc Lập
                </span>
              </div>
              <p className="remotion-studio-subtitle">
                Hệ thống biên tập phân cảnh, lồng tiếng thuyết minh & cắt ghép video marketing đa nền tảng.
              </p>
            </div>
          </div>

          <div className="remotion-studio-header-actions">
            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--primary"
              onClick={() => handleOpenTab(getDeployUrl())}
              title="Mở ngay Studio trên tab trình duyệt riêng"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Mở Tab Remotion Studio</span>
            </button>

            <button
              type="button"
              className="remotion-action-btn remotion-action-btn--secondary"
              onClick={handleGoToPublish}
              title="Chuyển sang AI Agent Đăng bài"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              <span>AI Agent Đăng Bài</span>
            </button>
          </div>
        </div>

        {/* Main Notice Hero Workspace */}
        <div className="remotion-notice-workspace">
          <div className="remotion-notice-card">
            <div className="remotion-notice-badge">🎬 Trải Nghiệm Full-Screen Đỉnh Cao</div>
            
            <h2 className="remotion-notice-title">
              Studio Đã Được Mở Trên Tab Trình Duyệt Riêng Biệt
            </h2>

            <p className="remotion-notice-desc">
              Để đảm bảo <strong>hiệu năng dựng phim mượt mà 60 FPS</strong>, thao tác cắt ghép video dài không bị giật lag và có không gian làm việc rộng rãi nhất, toàn bộ công cụ <strong>Remotion Video Studio</strong> đã được chuyển sang hoạt động trên một Tab độc lập.
            </p>

            {/* Prominent Action Buttons */}
            <div className="remotion-notice-actions">
              <button
                type="button"
                className="remotion-btn-launch-glow"
                onClick={() => handleOpenTab(getDeployUrl())}
              >
                <span className="remotion-launch-icon">🚀</span>
                <span className="remotion-launch-text">
                  <strong>Vào Ngay Tab Remotion Video Studio</strong>
                  <small>Nhấp vào đây nếu tab chưa tự động mở hoặc bạn đã lỡ đóng</small>
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="remotion-alternative-row">
              <span>Hoặc mở trên các môi trường khác:</span>
              <button
                type="button"
                className="remotion-link-btn"
                onClick={() => handleOpenTab(REMOTION_LOCAL_URL)}
                title="Mở phiên bản local Node.js chạy cổng 3000"
              >
                💻 Mở Localhost:3000
              </button>
              <span className="remotion-dot-sep">•</span>
              <button
                type="button"
                className="remotion-link-btn"
                onClick={() => handleOpenTab(getDeployUrl())}
                title="Mở đường dẫn bản deploy tích hợp"
              >
                🌐 Mở /remotion-app/index.html
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="remotion-features-grid">
              <div className="remotion-feature-item">
                <span className="remotion-feature-icon">✂️</span>
                <div>
                  <h4>Cắt Ghép Video Dài Siêu Mượt</h4>
                  <p>Tua và xem video tức thì, hỗ trợ co kéo 2 đầu trái/phải chuẩn tỷ lệ dọc 9:16 TikTok.</p>
                </div>
              </div>

              <div className="remotion-feature-item">
                <span className="remotion-feature-icon">🎙️</span>
                <div>
                  <h4>Lồng Tiếng AI Chuẩn Việt Nam</h4>
                  <p>Tự động tạo giọng đọc truyền cảm (Bắc / Nam) bằng Edge-TTS theo từng phân cảnh kịch bản.</p>
                </div>
              </div>

              <div className="remotion-feature-item">
                <span className="remotion-feature-icon">📝</span>
                <div>
                  <h4>Phụ Đề Karaoke Nhảy Chữ</h4>
                  <p>Tự động bóc tách từ ngữ, hiệu ứng nhảy chữ vàng/xanh neon bắt mắt, đa dạng font chữ TikTok.</p>
                </div>
              </div>

              <div className="remotion-feature-item">
                <span className="remotion-feature-icon">⚡</span>
                <div>
                  <h4>Không Gian Làm Việc Rộng Rãi</h4>
                  <p>Tận dụng 100% diện tích màn hình máy tính, quản lý timeline và visual layer chuyên nghiệp.</p>
                </div>
              </div>
            </div>

            {/* Footer Hint */}
            <div className="remotion-notice-footer">
              💡 <strong>Mẹo:</strong> Sau khi hoàn tất video ở tab Remotion Studio, bạn có thể tải video về máy và chuyển sang mục <strong>"AI Agent Đăng Bài"</strong> bên cạnh để đăng trực tiếp lên Facebook Fanpage và kênh YouTube của Lá Đỏ Homestay!
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
