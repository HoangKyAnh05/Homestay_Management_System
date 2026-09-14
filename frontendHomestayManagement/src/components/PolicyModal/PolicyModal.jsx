import React, { useState } from 'react'
import './PolicyModal.css'

export const POLICY_TABS = [
  {
    id: 'terms',
    title: 'Điều Khoản Đặt Phòng',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    content: (
      <div className="policy-content-section">
        <h3>Quy Định & Điều Khoản Đặt Phòng tại Lá Đỏ Homestay Sa Pa</h3>
        <p className="policy-intro">
          Chào mừng quý khách đến với Lá Đỏ Homestay. Để đảm bảo trải nghiệm nghỉ dưỡng hoàn hảo và quyền lợi tốt nhất cho đôi bên, xin vui lòng tham khảo các điều khoản dưới đây:
        </p>
        <ul className="policy-list">
          <li>
            <strong>1. Xác nhận đặt phòng:</strong> Đơn đặt phòng chỉ có hiệu lực chính thức sau khi quý khách hoàn tất thanh toán tiền cọc (tối thiểu 50% hoặc 100% giá trị đơn đặt) trong thời gian giữ chỗ quy định (5 - 15 phút).
          </li>
          <li>
            <strong>2. Thông tin khách lưu trú:</strong> Quý khách vui lòng cung cấp đúng số lượng khách (người lớn, trẻ em) và CCCD/Hộ chiếu hợp lệ khi làm thủ tục nhận phòng theo quy định của pháp luật.
          </li>
          <li>
            <strong>3. Phụ thu thêm người:</strong> Trẻ em dưới 6 tuổi được miễn phí khi ngủ cùng bố mẹ. Trẻ từ 6–11 tuổi hoặc người lớn phát sinh vượt tiêu chuẩn phòng sẽ tính phụ thu theo quy định hiện hành.
          </li>
          <li>
            <strong>4. Thú cưng & Môi trường:</strong> Vui lòng thông báo trước nếu có thú cưng đi cùng. Giữ gìn vệ sinh chung, không hút thuốc trong phòng ngủ và không gây ồn ào sau 22:00 để đảm bảo không gian yên tĩnh của núi rừng.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'privacy',
    title: 'Chính Sách Bảo Mật',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    content: (
      <div className="policy-content-section">
        <h3>Chính Sách Bảo Mật Thông Tin Khách Hàng</h3>
        <p className="policy-intro">
          Lá Đỏ Homestay cam kết tôn trọng và bảo vệ tuyệt đối thông tin cá nhân và dữ liệu thanh toán của quý khách hàng:
        </p>
        <ul className="policy-list">
          <li>
            <strong>1. Mục đích thu thập:</strong> Thông tin cá nhân (Họ tên, SĐT, Email, CCCD) chỉ được sử dụng cho mục đích đăng ký tạm trú, xác nhận đặt phòng, hỗ trợ chăm sóc khách hàng và xuất hóa đơn dịch vụ.
          </li>
          <li>
            <strong>2. Bảo mật thanh toán:</strong> Mọi giao dịch thanh toán chuyển khoản qua VietQR / SePay hoặc thẻ ngân hàng đều được mã hóa theo tiêu chuẩn bảo mật ngân hàng quốc gia, homestay không lưu trữ mã PIN hay CVV thẻ.
          </li>
          <li>
            <strong>3. Cam kết không chia sẻ:</strong> Lá Đỏ Homestay tuyệt đối không bán, cho thuê hay tiết lộ thông tin của quý khách cho bất kỳ bên thứ ba nào vì mục đích thương mại.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'cancellation',
    title: 'Chính Sách Hủy & Hoàn Tiền',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    content: (
      <div className="policy-content-section">
        <h3>Chính Sách Hủy Phòng & Hoàn Trả Tiền Cọc</h3>
        <p className="policy-intro">
          Chúng tôi hiểu rằng kế hoạch du lịch có thể thay đổi bất ngờ. Dưới đây là quy chế hủy và hoàn tiền tại Lá Đỏ Homestay:
        </p>
        <ul className="policy-list">
          <li>
            <strong>• Hủy trước ngày check-in từ 7 ngày trở lên:</strong> Hoàn 100% tiền cọc hoặc hỗ trợ bảo lưu ngày đặt phòng trong vòng 6 tháng (miễn phí đổi ngày 01 lần).
          </li>
          <li>
            <strong>• Hủy từ 3 đến 6 ngày trước ngày check-in:</strong> Hoàn 50% tiền cọc hoặc hỗ trợ đổi lịch sang giai đoạn khác (áp dụng chênh lệch giá nếu có).
          </li>
          <li>
            <strong>• Hủy trong vòng 48 giờ trước ngày check-in hoặc không đến (No-Show):</strong> Không hoàn lại tiền đặt cọc do homestay đã giữ phòng độc quyền và từ chối các khách đặt khác.
          </li>
          <li>
            <strong>• Trường hợp bất khả kháng (Thiên tai, sạt lở, bão lũ Sa Pa):</strong> Homestay hỗ trợ 100% đổi dời ngày hoặc hoàn cọc theo thỏa thuận trực tiếp qua Hotline <strong>0941 186 699</strong>.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'checkin',
    title: 'Hướng Dẫn Nhận & Trả Phòng',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    content: (
      <div className="policy-content-section">
        <h3>Thời Gian & Quy Trình Nhận - Trả Phòng Tiêu Chuẩn</h3>
        <div className="checkin-highlight-box">
          <div className="checkin-time-badge in">
            <span className="time-label">GIỜ NHẬN PHÒNG (CHECK-IN)</span>
            <span className="time-val">Từ 14:00</span>
          </div>
          <div className="checkin-time-divider">➜</div>
          <div className="checkin-time-badge out">
            <span className="time-label">GIỜ TRẢ PHÒNG (CHECK-OUT)</span>
            <span className="time-val">Trước 11:00</span>
          </div>
        </div>
        <ul className="policy-list">
          <li>
            <strong>1. Nhận phòng sớm (Early Check-in):</strong> Nếu quý khách đến sớm trước 14:00 và phòng đã được dọn sạch hoàn tất, homestay sẽ hỗ trợ nhận phòng sớm miễn phí. Nếu phòng đang có khách, quý khách có thể gửi hành lý tại quầy Lễ tân, thưởng thức trà ngắm thung lũng Mường Hoa.
          </li>
          <li>
            <strong>2. Trả phòng muộn (Late Check-out):</strong> Trả phòng sau 11:00 phụ thuộc vào tình trạng phòng trống ngày hôm đó. Vui lòng liên hệ Lễ tân trước 09:00 để được sắp xếp thuận tiện nhất.
          </li>
          <li>
            <strong>3. Giấy tờ cần chuẩn bị:</strong> Bản gốc CCCD / Hộ chiếu hoặc VNeID để nhân viên lễ tân hỗ trợ quét OCR check-in tự động nhanh chóng trong 30 giây.
          </li>
          <li>
            <strong>4. Hỗ trợ 24/7:</strong> Bất cứ khi nào cần hỗ trợ đường đi, xe đón tiễn hoặc hành lý, xin vui lòng gọi ngay Hotline: <strong>0941 186 699</strong>.
          </li>
        </ul>
      </div>
    ),
  },
]

export default function PolicyModal({ isOpen, initialTab = 'terms', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const currentTabObj = POLICY_TABS.find((t) => t.id === activeTab) || POLICY_TABS[0]

  return (
    <div className="policy-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="policy-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="policy-modal-header">
          <div className="policy-modal-title-wrap">
            <span className="policy-leaf">🍁</span>
            <div>
              <h2>Chính Sách & Quy Định Lưu Trú</h2>
              <p>Lá Đỏ Homestay Sa Pa • Komorebi Mountain Retreat</p>
            </div>
          </div>
          <button type="button" className="policy-modal-close-btn" onClick={onClose} aria-label="Đóng modal">
            ×
          </button>
        </div>

        <div className="policy-modal-nav">
          {POLICY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`policy-nav-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.title}</span>
            </button>
          ))}
        </div>

        <div className="policy-modal-body">
          {currentTabObj.content}
        </div>

        <div className="policy-modal-footer">
          <div className="policy-support-hint">
            <span>Hotline hỗ trợ 24/7: </span>
            <a href="tel:0941186699">0941 186 699</a>
          </div>
          <button type="button" className="policy-primary-btn" onClick={onClose}>
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
