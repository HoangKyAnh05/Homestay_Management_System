import React, { useState, useEffect, useRef } from 'react';
import { Application } from '@splinetool/runtime';
import './Spline3DSection.css';

export const SPLINE_PRESETS = [
  {
    id: 'sapa-sanctuary',
    name: '🍁 Lá Đỏ Sa Pa Sanctuary',
    tagline: 'Không gian 3D nghệ thuật hòa quyện thiên nhiên Hoàng Liên Sơn',
    description: 'Mô phỏng đa chiều kiến trúc mộc mạc và năng lượng an yên của Lá Đỏ Homestay. Xoay và khám phá luồng gió núi cùng ánh nắng ban mai.',
    url: 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode',
    accentColor: '#10b981',
  },
  {
    id: 'wooden-cabin',
    name: '🪵 Không Gian Phòng Gỗ & Ban Công Săn Mây',
    tagline: 'Góc nhìn 3D trực quan nội thất ấm cúng',
    description: 'Tương tác trực tiếp với không gian phòng nghỉ: giường nệm cao cấp, ban công kính ngắm mây và ánh đèn vàng ấm áp.',
    url: 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',
    accentColor: '#f59e0b',
  },
  {
    id: 'floating-island',
    name: '🏔️ Đỉnh Núi Hoàng Liên Sơn Bồng Bềnh',
    tagline: 'Đảo mây ngàn & thung lũng Mường Hoa',
    description: 'Khung cảnh thiên nhiên kỳ vĩ bao quanh Lá Đỏ Homestay với mây vờn sườn núi và rặng thông sa mộc xanh ngát.',
    url: 'https://prod.spline.design/V0eD7J9u3g3XfFp1/scene.splinecode',
    accentColor: '#0284c7',
  },
];

export default function Spline3DSection() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const [activePreset, setActivePreset] = useState(SPLINE_PRESETS[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [currentSceneUrl, setCurrentSceneUrl] = useState(SPLINE_PRESETS[0].url);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(25);
  const [hasError, setHasError] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isCustomUrlInputOpen, setIsCustomUrlInputOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sectionContainerRef = useRef(null);

  const [isIntersected, setIsIntersected] = useState(false);

  // Lazy trigger: Only initialize heavy WebGL Spline 3D when user scrolls near
  useEffect(() => {
    const el = sectionContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load Spline Scene when intersected
  useEffect(() => {
    if (!isIntersected) return;

    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);
    setLoadProgress(30);

    const progressTimer = setInterval(() => {
      setLoadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 250);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dispose previous application instance if existed
    if (appRef.current) {
      try {
        if (typeof appRef.current.dispose === 'function') {
          appRef.current.dispose();
        }
      } catch (e) {
        console.warn('Spline dispose warning:', e);
      }
      appRef.current = null;
    }

    const app = new Application(canvas);
    appRef.current = app;

    app
      .load(currentSceneUrl)
      .then(() => {
        if (!isCancelled) {
          clearInterval(progressTimer);
          setLoadProgress(100);
          setTimeout(() => {
            if (!isCancelled) setIsLoading(false);
          }, 300);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          clearInterval(progressTimer);
          console.error('Lỗi khởi tạo Spline 3D Scene:', err);
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      clearInterval(progressTimer);
      if (appRef.current) {
        try {
          if (typeof appRef.current.dispose === 'function') {
            appRef.current.dispose();
          }
        } catch {}
      }
    };
  }, [currentSceneUrl, isIntersected]);

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    setCurrentSceneUrl(preset.url);
  };

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    if (!trimmed.endsWith('.splinecode') && !trimmed.includes('spline.design')) {
      alert('Vui lòng nhập đường dẫn hợp lệ từ Spline (định dạng URL chứa file .splinecode)');
      return;
    }
    setActivePreset({
      id: 'custom-scene',
      name: '✨ Không gian 3D Tùy Chỉnh Của Bạn',
      tagline: 'Được tải trực tiếp từ URL Spline của bạn',
      description: 'Mô hình 3D tương tác theo liên kết cá nhân bạn vừa cung cấp.',
      url: trimmed,
      accentColor: '#ec4899',
    });
    setCurrentSceneUrl(trimmed);
    setIsCustomUrlInputOpen(false);
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!sectionContainerRef.current) return;
    const isFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    if (!isFs) {
      const elem = sectionContainerRef.current;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  return (
    <section
      ref={sectionContainerRef}
      className={`spline-showcase-section ${isFullscreen ? 'is-fullscreen' : ''}`}
      id="spline-experience"
      aria-label="Khám phá không gian 3D tương tác Lá Đỏ Homestay"
    >
      {/* Background Ambience Glow */}
      <div className="spline-ambient-glow" />

      <div className="spline-content-wrapper">
        {/* Section Header */}
        <div className="spline-header">
          <div className="spline-badge">
            <span className="spline-badge-dot" />
            <span>TRẢI NGHIỆM TƯƠNG TÁC 3D REAL-TIME</span>
          </div>
          <h2 className="spline-title">
            Khám Phá <span className="text-gradient-gold">Lá Đỏ Homestay Sa Pa</span> Qua Không Gian 3D Sống Động
          </h2>
          <p className="spline-subtitle">
            Tự do xoay 360°, phóng to chi tiết nội thất và cảm nhận trọn vẹn vẻ đẹp mộc mạc của núi rừng Tây Bắc ngay trên màn hình thiết bị của bạn.
          </p>
        </div>

        {/* Preset Selector Tabs */}
        <div className="spline-presets-bar">
          <div className="spline-preset-tabs">
            {SPLINE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`spline-preset-btn ${activePreset.id === preset.id ? 'is-active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <span className="spline-preset-icon">{preset.name.split(' ')[0]}</span>
                <span className="spline-preset-name">{preset.name.substring(preset.name.indexOf(' ') + 1)}</span>
              </button>
            ))}
          </div>

          <div className="spline-extra-actions">
            <button
              type="button"
              className="spline-action-btn spline-action-btn--custom"
              onClick={() => setIsCustomUrlInputOpen((prev) => !prev)}
              title="Dán link Spline 3D Scene riêng của bạn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>Tự chèn Link Spline</span>
            </button>

            <button
              type="button"
              className="spline-action-btn spline-action-btn--guide"
              onClick={() => setShowGuideModal(true)}
              title="Xem hướng dẫn tự thiết kế 3D bằng Spline.design"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Hướng dẫn tạo 3D</span>
            </button>
          </div>
        </div>

        {/* Custom URL Input Accordion */}
        {isCustomUrlInputOpen && (
          <form onSubmit={handleApplyCustomUrl} className="spline-custom-url-form">
            <div className="spline-input-group">
              <span className="spline-input-prefix">https://</span>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Dán URL .splinecode từ spline.design (VD: prod.spline.design/.../scene.splinecode)"
                required
              />
              <button type="submit" className="spline-apply-btn">
                Tải Scene 3D
              </button>
            </div>
            <p className="spline-input-hint">
              💡 Mẹo: Thiết kế mô hình tại <strong>spline.design</strong> → Bấm <strong>Export</strong> → Chọn <strong>Vanilla JS / Code Export</strong> → Sao chép đường dẫn <code>scene.splinecode</code> và dán vào đây.
            </p>
          </form>
        )}

        {/* 3D Canvas Viewport Box */}
        <div className="spline-viewport-card">
          {/* Active Preset Overlay Info */}
          <div className="spline-info-overlay">
            <span className="spline-info-tag">{activePreset.tagline}</span>
            <h3 className="spline-info-title">{activePreset.name}</h3>
            <p className="spline-info-desc">{activePreset.description}</p>
          </div>

          {/* Interactive Tooltips overlay */}
          <div className="spline-controls-hint">
            <div className="hint-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
              <span>Kéo chuột để xoay 360°</span>
            </div>
            <div className="hint-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Cuộn chuột để Phóng to / Thu nhỏ</span>
            </div>
            <button
              type="button"
              className="spline-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ' : 'Xem toàn màn hình'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            </button>
          </div>

          {/* Loading Shimmer State */}
          {isLoading && (
            <div className="spline-loading-curtain">
              <div className="spline-spinner-orb">
                <div className="spinner-core" />
              </div>
              <p className="spline-loading-text">Đang tải không gian 3D tương tác ({loadProgress}%)...</p>
              <div className="spline-progress-bar">
                <div className="spline-progress-fill" style={{ width: `${loadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Error Fallback */}
          {hasError && (
            <div className="spline-error-curtain">
              <div className="spline-error-icon">⚠️</div>
              <h4>Không thể tải Scene 3D trực tiếp</h4>
              <p>Trình duyệt chưa hỗ trợ đầy đủ WebGL hoặc đường dẫn không phản hồi. Bạn có thể chọn Preset khác hoặc dán link Spline mới.</p>
              <button
                type="button"
                className="spline-retry-btn"
                onClick={() => setCurrentSceneUrl(SPLINE_PRESETS[0].url)}
              >
                Tải lại cảnh mặc định
              </button>
            </div>
          )}

          {/* Spline Canvas */}
          <canvas
            ref={canvasRef}
            className="spline-canvas"
            aria-label="Khung vẽ đồ họa 3D Spline"
          />
        </div>

        {/* Feature Highlights Grid */}
        <div className="spline-features-grid">
          <div className="spline-feature-item">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <h4>Đồ Họa 3D Real-time</h4>
              <p>Mô phỏng ánh sáng mặt trời Hoàng Liên Sơn và chất liệu gỗ thông tự nhiên qua công nghệ WebGL tiên tiến.</p>
            </div>
          </div>

          <div className="spline-feature-item">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h4>Khám Phá Toàn Cảnh 360°</h4>
              <p>Tự do thay đổi góc nhìn, quan sát từ thung lũng Mường Hoa đến các góc ban công săn mây tuyệt tác.</p>
            </div>
          </div>

          <div className="spline-feature-item">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h4>Tương Thích Mọi Thiết Bị</h4>
              <p>Tối ưu hóa GPU mượt mà trên cả máy tính, máy tính bảng và điện thoại mà không cần cài đặt thêm phần mềm.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Modal: How to create Spline 3D Scene */}
      {showGuideModal && (
        <div className="spline-modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="spline-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="spline-modal-header">
              <div>
                <h3>🎨 Hướng Dẫn Tự Tạo 3D Scene Cho Dự Án Bằng Spline</h3>
                <p>Quy trình 4 bước đơn giản để tạo và gắn mô hình 3D vào Lá Đỏ Homestay</p>
              </div>
              <button
                type="button"
                className="spline-modal-close"
                onClick={() => setShowGuideModal(false)}
              >
                ×
              </button>
            </div>

            <div className="spline-modal-body">
              <div className="guide-step">
                <div className="step-num">1</div>
                <div className="step-content">
                  <h4>Truy cập và Đăng ký Spline miễn phí</h4>
                  <p>
                    Vào trang web <a href="https://spline.design" target="_blank" rel="noreferrer">spline.design</a> và tạo một tài khoản miễn phí. Spline là công cụ thiết kế 3D trên trình duyệt chuyên nghiệp và rất trực quan.
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-num">2</div>
                <div className="step-content">
                  <h4>Tạo mô hình theo chủ đề Homestay & Thiên nhiên Sa Pa</h4>
                  <p>
                    Bạn có thể chọn từ kho thư viện có sẵn (Community / Library) các đối tượng như:
                  </p>
                  <ul>
                    <li><strong>Cabin / Nhà gỗ:</strong> Tạo không gian homestay ấm cúng.</li>
                    <li><strong>Đồi núi & Đám mây (Cloud & Mountain):</strong> Tạo hiệu ứng thung lũng Mường Hoa bồng bềnh.</li>
                    <li><strong>Cây cối & Lá đỏ (Autumn Leaves):</strong> Tạo điểm nhấn đặc trưng cho Lá Đỏ Homestay.</li>
                  </ul>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <h4>Xuất file nhúng (Code Export)</h4>
                  <p>
                    Nhấn nút <strong>Export</strong> ở góc trên bên phải màn hình Spline.
                  </p>
                  <p>
                    Chọn tab <strong>Vanilla JS</strong> hoặc <strong>Spline Viewer</strong> &gt; Nhấn <strong>Public URL</strong> &gt; Sao chép đường link có đuôi <code>.../scene.splinecode</code>.
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-num">4</div>
                <div className="step-content">
                  <h4>Dán vào Landing Page và xem kết quả ngay</h4>
                  <p>
                    Nhấn nút <strong>"Tự chèn Link Spline"</strong> trên phần 3D của trang chủ và dán đường link vừa sao chép. Hệ thống sẽ kết xuất trực tiếp mô hình 3D của bạn tức thì mà không cần biên dịch lại code!
                  </p>
                </div>
              </div>
            </div>

            <div className="spline-modal-footer">
              <a
                href="https://spline.design"
                target="_blank"
                rel="noreferrer"
                className="spline-open-btn"
              >
                Mở Spline.design ↗
              </a>
              <button
                type="button"
                className="spline-close-btn"
                onClick={() => setShowGuideModal(false)}
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
