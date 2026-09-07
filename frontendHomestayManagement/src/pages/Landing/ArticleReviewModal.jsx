import React, { useEffect, useState } from 'react';
import './ArticleReviewModal.css';

function ArticleReviewModal({ article, onClose, onBookRoom }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!article) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="arm-article-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="arm-article-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="arm-close-btn" onClick={onClose} aria-label="Đóng bài viết">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Hero Cover Header */}
        <div className="arm-hero">
          <img src={article.coverImage} alt={article.title} className="arm-hero-img" />
          <div className="arm-hero-gradient"></div>
          <div className="arm-hero-meta">
            <div className="arm-tags-row">
              <span className="arm-category-badge">{article.category}</span>
              <span className="arm-time-badge">⏱️ {article.readTime}</span>
              <span className="arm-rating-badge">{article.rating}</span>
            </div>
            <h1 className="arm-title">{article.title}</h1>
            <p className="arm-subtitle">{article.subtitle}</p>
            <div className="arm-author-row">
              <div className="arm-author-avatar">🍁</div>
              <div className="arm-author-info">
                <strong>{article.author}</strong>
                <span>{article.date} · Cẩm nang du lịch Sa Pa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <div className="arm-content">
          {/* Quick Info Bar */}
          <div className="arm-info-bar">
            <div className="arm-info-item">
              <span className="arm-info-icon">📍</span>
              <div>
                <small>Vị Trí</small>
                <strong>{article.location}</strong>
              </div>
            </div>
            <div className="arm-info-item">
              <span className="arm-info-icon">🛵</span>
              <div>
                <small>Khoảng Cách</small>
                <strong>{article.distance}</strong>
              </div>
            </div>
            <div className="arm-info-item">
              <span className="arm-info-icon">⏰</span>
              <div>
                <small>Thời Điểm Lý Tưởng</small>
                <strong>{article.bestTime}</strong>
              </div>
            </div>
            <div className="arm-info-item">
              <span className="arm-info-icon">🎟️</span>
              <div>
                <small>Chi Phí Tham Khảo</small>
                <strong>{article.cost}</strong>
              </div>
            </div>
          </div>

          {/* Key Highlights */}
          {article.highlights && (
            <div className="arm-highlights-card">
              <h3>✨ Điểm Nổi Bật Không Thể Bỏ Lỡ:</h3>
              <ul>
                {article.highlights.map((h, i) => (
                  <li key={i}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Intro quote */}
          <blockquote className="arm-intro-quote">
            <p>"{article.intro}"</p>
          </blockquote>

          {/* Narrative Sections */}
          <div className="arm-sections">
            {article.sections && article.sections.map((sec, idx) => (
              <article key={idx} className="arm-section-block">
                <h2>{sec.heading}</h2>
                <div className="arm-section-body">
                  {sec.content.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>
                {sec.tip && (
                  <div className="arm-tip-box">
                    <span className="arm-tip-icon">💡</span>
                    <div>
                      <strong>Mẹo trải nghiệm:</strong>
                      <p>{sec.tip}</p>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Homestay Advice Banner */}
          {article.homestayAdvice && (
            <div className="arm-homestay-advice">
              <div className="arm-ha-header">
                <span className="arm-ha-badge">🍁 GỢI Ý TỪ LÁ ĐỎ HOMESTAY</span>
                <h3>Dịch vụ hỗ trợ khách lưu trú</h3>
              </div>
              <p>{article.homestayAdvice}</p>
              <div className="arm-ha-perks">
                <span>✓ Hỗ trợ thuê xe máy giao tận nơi</span>
                <span>✓ Đặt xe taxi / tour tham quan trọn gói</span>
                <span>✓ Tặng trà nóng & chuẩn bị bữa sáng mang đi</span>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="arm-footer">
            <button className="arm-share-btn" onClick={handleCopyLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              <span>{copied ? '✓ Đã sao chép link!' : 'Chia sẻ bài viết'}</span>
            </button>

            <div className="arm-footer-actions">
              <button className="arm-close-action-btn" onClick={onClose}>
                Đóng
              </button>
              <button className="arm-book-btn" onClick={onBookRoom}>
                <span>Đặt Phòng Để Trải Nghiệm Ngay</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleReviewModal;
