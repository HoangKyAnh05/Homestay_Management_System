import { useEffect, useState } from 'react'
import { getStoredToken } from '../../services/authService'
import AdminLayout from './AdminLayout'
import ArticleReviewModal from '../Landing/ArticleReviewModal'
import './AdminTravelArticlesPage.css'

const API_ADMIN_ARTICLES = (import.meta.env.VITE_API_URL || '') + '/api/admin/travel-articles'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getStoredToken()}`,
  }
}

const PRESET_IMAGES = [
  { label: 'Sương Phủ Hoàng Liên', url: '/landing/images/check-in-canh-dep/8-dia-diem-check-in-dep-quen-sau-o-hoa-binh-image-exa0-1720971802-683-width780height439.jpg' },
  { label: 'Cầu Gỗ Suối Mơ', url: '/landing/images/check-in-canh-dep/images-1.jpg' },
  { label: 'Rừng Trúc & Trà Đạo', url: '/landing/images/check-in-canh-dep/images-2.jpg' },
  { label: 'Hoàng Hôn Rừng Thông', url: '/landing/images/check-in-canh-dep/images.jpg' },
  { label: 'Ẩm Thực Sa Pa Nướng', url: '/landing/images/an-uong-thu-gian/amthucduongpho.jpg' },
  { label: 'Đặc Sản Tây Bắc', url: '/landing/images/an-uong-thu-gian/dac-diem-noi-bat-trong-du-lich-am-thuc-mien-bac.jpg' },
]

function ArticleEditModal({ article, isNew, onClose, onSave, saving }) {
  const [formData, setFormData] = useState(() => {
    if (!article || isNew) {
      return {
        title: '',
        subtitle: '',
        tag: 'Bình Minh • 05:45 AM',
        category: 'Săn Mây & Check-in',
        readTime: '5 phút đọc',
        author: 'Lá Đỏ Travel Editorial',
        dateTag: 'Mùa Săn Mây 2026',
        coverImageUrl: PRESET_IMAGES[0].url,
        rating: '4.9 ★ (1,000+ đánh giá)',
        location: '',
        distance: 'Cách Lá Đỏ Homestay khoảng 5km',
        bestTime: '06:00 - 08:00 sáng',
        cost: 'Miễn phí hoặc vé tham quan',
        highlightsText: 'Góc chụp ảnh triệu view\nKhông gian thiên nhiên trong lành\nThưởng thức ẩm thực nướng than hồng',
        intro: '',
        sectionsText: '1. Thời Điểm Vàng Tham Quan\nBuổi sáng sớm là lúc cảnh sắc thơ mộng nhất...\n\n2. Trải Nghiệm Ăn Chơi Nổi Bật\nKhám phá các góc sống ảo và thưởng thức đặc sản...',
        tipText: 'Nên mang theo áo ấm và giày thể thao thoải mái.',
        homestayAdvice: 'Từ Lá Đỏ Homestay, bạn có thể thuê xe máy ngay tại quầy lễ tân hoặc nhờ nhân viên gọi taxi với giá ưu đãi.',
        sortOrder: 1,
        isActive: true,
      }
    }

    let parsedHighlights = ''
    try {
      const arr = JSON.parse(article.highlightsJson || '[]')
      parsedHighlights = Array.isArray(arr) ? arr.join('\n') : ''
    } catch {
      parsedHighlights = article.highlightsJson || ''
    }

    let parsedSections = ''
    let parsedTip = ''
    try {
      const secs = JSON.parse(article.sectionsJson || '[]')
      if (Array.isArray(secs) && secs.length > 0) {
        parsedSections = secs.map((s) => `${s.heading}\n${s.content}`).join('\n\n')
        parsedTip = secs[0]?.tip || ''
      }
    } catch {
      parsedSections = article.sectionsJson || ''
    }

    return {
      title: article.title || '',
      subtitle: article.subtitle || '',
      tag: article.tag || '',
      category: article.category || '',
      readTime: article.readTime || '',
      author: article.author || '',
      dateTag: article.dateTag || '',
      coverImageUrl: article.coverImageUrl || '',
      rating: article.rating || '',
      location: article.location || '',
      distance: article.distance || '',
      bestTime: article.bestTime || '',
      cost: article.cost || '',
      highlightsText: parsedHighlights,
      intro: article.intro || '',
      sectionsText: parsedSections,
      tipText: parsedTip,
      homestayAdvice: article.homestayAdvice || '',
      sortOrder: article.sortOrder ?? 0,
      isActive: article.isActive ?? true,
    }
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const highlightsArr = formData.highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const rawSections = formData.sectionsText.split('\n\n').filter(Boolean)
    const sectionsArr = rawSections.map((secStr, idx) => {
      const lines = secStr.split('\n').map((l) => l.trim()).filter(Boolean)
      const heading = lines[0] || `Mục ${idx + 1}`
      const content = lines.slice(1).join('\n') || heading
      return {
        heading,
        content,
        tip: idx === 0 ? formData.tipText : undefined,
      }
    })

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle,
      tag: formData.tag,
      category: formData.category,
      readTime: formData.readTime,
      author: formData.author,
      dateTag: formData.dateTag,
      coverImageUrl: formData.coverImageUrl,
      rating: formData.rating,
      location: formData.location,
      distance: formData.distance,
      bestTime: formData.bestTime,
      cost: formData.cost,
      highlightsJson: JSON.stringify(highlightsArr),
      intro: formData.intro,
      sectionsJson: JSON.stringify(sectionsArr),
      homestayAdvice: formData.homestayAdvice,
      sortOrder: Number(formData.sortOrder) || 0,
      isActive: formData.isActive,
    }

    onSave(payload)
  }

  return (
    <div className="ata-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ata-modal-card">
        <div className="ata-modal-head">
          <div>
            <h2>{isNew ? 'Thêm Địa Điểm & Bài Báo Review Mới' : `Chỉnh Sửa: ${article.title}`}</h2>
            <p>Thông tin sẽ xuất hiện trực tiếp trên trang chủ Landing Page của Lá Đỏ Homestay</p>
          </div>
          <button className="ata-close-x" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="ata-form">
          <div className="ata-form-grid">
            {/* Tiêu đề & phụ đề */}
            <div className="ata-field full">
              <label>Tiêu đề bài viết review *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: Săn Biển Mây Đỉnh Đèo Ô Quy Hồ & Cổng Trời Sa Pa"
              />
            </div>

            <div className="ata-field full">
              <label>Phụ đề / Tóm tắt ngắn</label>
              <textarea
                name="subtitle"
                rows={2}
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Mô tả tóm tắt lôi cuốn xuất hiện ở thẻ ảnh và dưới tiêu đề..."
              />
            </div>

            {/* Thể loại & Tag */}
            <div className="ata-field">
              <label>Chuyên mục / Danh mục</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="VD: Săn Mây & Check-in, Ẩm Thực, Văn Hóa..."
              />
            </div>

            <div className="ata-field">
              <label>Nhãn thẻ (Tag hiển thị trên ảnh)</label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                placeholder="VD: Bình Minh • 05:45 AM, Suối Ngầm..."
              />
            </div>

            {/* Vị trí & Khoảng cách */}
            <div className="ata-field">
              <label>Vị trí địa lý cụ thể</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="VD: Bản Cát Cát, xã San Sả Hồ, Sa Pa"
              />
            </div>

            <div className="ata-field">
              <label>Khoảng cách từ Lá Đỏ Homestay</label>
              <input
                type="text"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="VD: Cách Lá Đỏ Homestay chỉ 2.5km (8 phút đi xe máy)"
              />
            </div>

            {/* Giờ vàng & Chi phí */}
            <div className="ata-field">
              <label>Thời điểm lý tưởng trong ngày</label>
              <input
                type="text"
                name="bestTime"
                value={formData.bestTime}
                onChange={handleChange}
                placeholder="VD: 05:45 - 07:30 (Bình minh mây tràn)"
              />
            </div>

            <div className="ata-field">
              <label>Chi phí / Giá vé tham khảo</label>
              <input
                type="text"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="VD: Vé vào cổng: 150.000đ/người lớn"
              />
            </div>

            {/* Ảnh bìa */}
            <div className="ata-field full">
              <label>Đường dẫn ảnh bìa (Cover Image URL) *</label>
              <div className="ata-cover-picker">
                <input
                  type="text"
                  name="coverImageUrl"
                  required
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  placeholder="/landing/images/check-in-canh-dep/..."
                />
                {formData.coverImageUrl && (
                  <img src={formData.coverImageUrl} alt="Preview" className="ata-cover-preview" />
                )}
              </div>
              <div className="ata-preset-pills">
                <span>Chọn nhanh ảnh có sẵn:</span>
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="ata-preset-btn"
                    onClick={() => setFormData((p) => ({ ...p, coverImageUrl: preset.url }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Điểm nổi bật */}
            <div className="ata-field full">
              <label>Điểm nổi bật (Mỗi dòng 1 gạch đầu dòng)</label>
              <textarea
                name="highlightsText"
                rows={4}
                value={formData.highlightsText}
                onChange={handleChange}
                placeholder="Điểm 1&#10;Điểm 2&#10;Điểm 3"
              />
            </div>

            {/* Mở đầu */}
            <div className="ata-field full">
              <label>Đoạn dẫn nhập / Giới thiệu cảm xúc (Intro)</label>
              <textarea
                name="intro"
                rows={3}
                value={formData.intro}
                onChange={handleChange}
                placeholder="Nếu hỏi đâu là khoảnh khắc làm xiêu lòng bất kỳ kẻ lữ hành nào..."
              />
            </div>

            {/* Nội dung bài viết */}
            <div className="ata-field full">
              <label>Các phần nội dung bài viết chi tiết</label>
              <textarea
                name="sectionsText"
                rows={6}
                value={formData.sectionsText}
                onChange={handleChange}
                placeholder="1. Tiêu đề mục 1&#10;Nội dung mục 1...&#10;&#10;2. Tiêu đề mục 2&#10;Nội dung mục 2..."
              />
            </div>

            {/* Mẹo trải nghiệm */}
            <div className="ata-field full">
              <label>💡 Mẹo trải nghiệm & Lưu ý hữu ích</label>
              <input
                type="text"
                name="tipText"
                value={formData.tipText}
                onChange={handleChange}
                placeholder="Mẹo săn mây: hãy theo dõi dự báo thời tiết..."
              />
            </div>

            {/* Lời khuyên từ Lá Đỏ */}
            <div className="ata-field full">
              <label>🍁 Lời khuyên & Dịch vụ hỗ trợ từ Lá Đỏ Homestay</label>
              <textarea
                name="homestayAdvice"
                rows={3}
                value={formData.homestayAdvice}
                onChange={handleChange}
                placeholder="Từ Lá Đỏ Homestay, bạn có thể thuê xe máy ngay tại quầy lễ tân..."
              />
            </div>

            {/* Thứ tự & Hiển thị */}
            <div className="ata-field">
              <label>Thứ tự sắp xếp (1, 2, 3...)</label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleChange}
              />
            </div>

            <div className="ata-field ata-field-checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Đang hiển thị trên Landing Page</span>
              </label>
            </div>
          </div>

          <div className="ata-form-footer">
            <button type="button" className="ata-btn-ghost" onClick={onClose} disabled={saving}>
              Hủy bỏ
            </button>
            <button type="submit" className="ata-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu bài viết...' : isNew ? 'Thêm bài viết mới' : 'Cập nhật thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminTravelArticlesPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [editingArticle, setEditingArticle] = useState(null)
  const [isNewModal, setIsNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewArticle, setPreviewArticle] = useState(null)

  const fetchArticles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_ADMIN_ARTICLES, { headers: authHeaders() })
      if (!res.ok) throw new Error('Không thể tải danh sách bài viết từ server')
      const data = await res.json()
      setArticles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Lỗi khi tải bài viết')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_ADMIN_ARTICLES}/${id}/toggle-status`, {
        method: 'PUT',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Không thể đổi trạng thái bài viết')
      const updated = await res.json()
      setArticles((prev) => prev.map((a) => (a.id === id ? updated : a)))
      showToast('Đã đổi trạng thái hiển thị thành công!')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài viết review: "${title}"?`)) return
    try {
      const res = await fetch(`${API_ADMIN_ARTICLES}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Không thể xóa bài viết')
      setArticles((prev) => prev.filter((a) => a.id !== id))
      showToast('Đã xóa bài viết thành công!')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      let res
      if (isNewModal) {
        res = await fetch(API_ADMIN_ARTICLES, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API_ADMIN_ARTICLES}/${editingArticle.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Không thể lưu bài viết')
      }

      const saved = await res.json()
      if (isNewModal) {
        setArticles((prev) => [...prev, saved])
        showToast('Đã tạo mới bài viết review Sa Pa thành công!')
      } else {
        setArticles((prev) => prev.map((a) => (a.id === saved.id ? saved : a)))
        showToast('Đã cập nhật bài viết review thành công!')
      }
      setEditingArticle(null)
      setIsNewModal(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const showToast = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  // Convert entity format to ArticleReviewModal format for live preview
  const formatForPreview = (entity) => {
    let highlights = []
    try {
      highlights = JSON.parse(entity.highlightsJson || '[]')
    } catch {
      highlights = []
    }

    let sections = []
    try {
      sections = JSON.parse(entity.sectionsJson || '[]')
    } catch {
      sections = []
    }

    return {
      title: entity.title,
      subtitle: entity.subtitle,
      tag: entity.tag,
      category: entity.category,
      readTime: entity.readTime,
      author: entity.author,
      date: entity.dateTag,
      coverImage: entity.coverImageUrl,
      rating: entity.rating,
      location: entity.location,
      distance: entity.distance,
      bestTime: entity.bestTime,
      cost: entity.cost,
      highlights,
      intro: entity.intro,
      sections,
      homestayAdvice: entity.homestayAdvice,
    }
  }

  return (
    <AdminLayout activeNav="travel-articles">
      <div className="ata-page">
        {/* Header bar */}
        <div className="ata-header-bar">
          <div>
            <div className="ata-badge">QUẢN LÝ NỘI DUNG MARKETING & REVIEW</div>
            <h1>Điểm Đến & Bài Báo Review Sa Pa</h1>
            <p>Quản lý các địa điểm ăn chơi, chụp ảnh và các bài viết cẩm nang du lịch hiển thị trên trang chủ Landing Page.</p>
          </div>
          <button
            className="ata-btn-add"
            onClick={() => {
              setEditingArticle(null)
              setIsNewModal(true)
            }}
          >
            <span>+ Thêm Điểm Đến Mới</span>
          </button>
        </div>

        {successMsg && <div className="ata-toast-success">{successMsg}</div>}
        {error && <div className="ata-toast-error">{error}</div>}

        {/* Content list */}
        {loading ? (
          <div className="ata-loading-card">Đang tải danh sách bài viết...</div>
        ) : articles.length === 0 ? (
          <div className="ata-empty-card">Chưa có bài viết review nào. Hãy bấm "+ Thêm Điểm Đến Mới" ở trên!</div>
        ) : (
          <div className="ata-cards-grid">
            {articles.map((item) => (
              <div className={`ata-article-card ${!item.isActive ? 'is-inactive' : ''}`} key={item.id}>
                <div className="ata-card-media">
                  <img src={item.coverImageUrl} alt={item.title} />
                  <span className="ata-card-tag">{item.tag || 'Sa Pa'}</span>
                  <span className={`ata-status-badge ${item.isActive ? 'active' : 'hidden'}`}>
                    {item.isActive ? '● Đang hiển thị' : '○ Đang ẩn'}
                  </span>
                </div>

                <div className="ata-card-body">
                  <div className="ata-card-meta">
                    <span className="ata-cat">{item.category}</span>
                    <span className="ata-order">Thứ tự: #{item.sortOrder}</span>
                  </div>
                  <h3 className="ata-card-title">{item.title}</h3>
                  <p className="ata-card-desc">{item.subtitle}</p>

                  <div className="ata-card-specs">
                    <div>
                      <small>Vị trí:</small>
                      <span>{item.location || 'Sa Pa'}</span>
                    </div>
                    <div>
                      <small>Khoảng cách:</small>
                      <span>{item.distance || 'Gần Lá Đỏ'}</span>
                    </div>
                  </div>

                  <div className="ata-card-actions">
                    <button
                      type="button"
                      className="ata-act-preview"
                      onClick={() => setPreviewArticle(formatForPreview(item))}
                    >
                      👁 Xem trước bài báo
                    </button>
                    <button
                      type="button"
                      className="ata-act-edit"
                      onClick={() => {
                        setEditingArticle(item)
                        setIsNewModal(false)
                      }}
                    >
                      ✏ Sửa
                    </button>
                    <button
                      type="button"
                      className="ata-act-toggle"
                      onClick={() => handleToggleStatus(item.id)}
                    >
                      {item.isActive ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      type="button"
                      className="ata-act-delete"
                      onClick={() => handleDelete(item.id, item.title)}
                    >
                      🗑 Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit / Create Modal */}
        {(editingArticle || isNewModal) && (
          <ArticleEditModal
            article={editingArticle}
            isNew={isNewModal}
            onClose={() => {
              setEditingArticle(null)
              setIsNewModal(false)
            }}
            onSave={handleSave}
            saving={saving}
          />
        )}

        {/* Live Reader Preview Modal */}
        {previewArticle && (
          <ArticleReviewModal
            article={previewArticle}
            onClose={() => setPreviewArticle(null)}
            onBookRoom={() => setPreviewArticle(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminTravelArticlesPage
