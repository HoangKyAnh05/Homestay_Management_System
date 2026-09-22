import { useEffect, useMemo, useState } from 'react'
import DateDropdownPicker from '../../components/Common/DateDropdownPicker'
import {
  getCurrentProfile,
  getStoredUser,
  logout,
  updateCurrentAvatar,
  updateCurrentProfile,
} from '../../services/authService'
import { resolveImageUrl } from '../../utils/imageUrl'
import { STAFF_ROLES, roleDefaultPath } from '../../utils/roleUtils'
import '../Home/HomePage.css'
import './ProfilePage.css'

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Chưa cập nhật'
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`
  }
  return dateStr
}

function UserAvatar({ user }) {
  const avatarUrl = resolveImageUrl(user?.avatarUrl)
  return (
    <span className="home-user-avatar" aria-hidden="true">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" />
      ) : (
        <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/></svg>
      )}
    </span>
  )
}

function PublicHeader() {
  const currentUser = getStoredUser()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  return (
    <header className="home-header">
      <a className="home-logo" href="/home">Lá Đỏ Homestay</a>
      <nav className="home-nav" aria-label="Điều hướng chính">
        <a href="/home">Trang chủ</a>
        <a href="/landing" className="home-nav-landing-link" title="Khám phá không gian 3D Lá Đỏ Tour & Săn Mây">🍁 Lá Đỏ 3D Tour</a>
        <a href="/explore" title="Khám phá xung quanh Lá Đỏ Homestay & Sa Pa">Khám phá xung quanh</a>
        <a href="/rooms">Phòng</a>
        <a href="/stay" title="Dịch vụ dành cho khách đang lưu trú">Dịch vụ lưu trú</a>
        <a href="/wishlist">Yêu thích</a>
        <a href="/amenities">Tiện nghi</a>
        <a
          href="/giveaway"
          className="home-nav-lucky-wheel"
          title="Vòng quay may mắn - Nhận ưu đãi nghỉ dưỡng!"
          aria-label="Vòng quay may mắn"
        >
          <svg className="lucky-wheel-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="7.5" />
            <path d="M12 2.5v15M4.5 10h15M6.7 4.7l10.6 10.6M6.7 15.3l10.6-10.6" />
            <circle cx="12" cy="10" r="2" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" />
            <path d="M8 21.5l2.5-4h3l2.5 4" />
            <line x1="6" y1="21.5" x2="18" y2="21.5" />
          </svg>
        </a>
        <a href="/home#about">Giới thiệu</a>
      </nav>

      {currentUser ? (
        <div className="home-user-menu">
          <button type="button" className="home-user" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            <UserAvatar user={currentUser} />
            <span>{currentUser.fullName || currentUser.email}</span>
            <svg className="home-user-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {isOpen && (
            <div className="home-user-dropdown">
              {STAFF_ROLES.has(currentUser?.role) && (
                <a href={roleDefaultPath(currentUser.role)}>
                  {currentUser.role === 'ROLE_ADMIN' ? 'Quản lý Lá Đỏ Homestay' : 'Bàn làm việc vận hành'}
                </a>
              )}
              <a href="/stay" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/stay'); }}>Dịch vụ lưu trú</a>
              <a href="/wishlist" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/wishlist'); }}>Danh sách yêu thích</a>
              <a href="/vouchers" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/vouchers'); }}>Kho mã giảm giá</a>
              <a href="/booking-history" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/booking-history'); }}>Lịch sử đặt phòng</a>
              <a href="/profile" onClick={(e) => { e.preventDefault(); setIsOpen(false); window.location.assign('/profile'); }}>Thông tin cá nhân</a>
              <button type="button" onClick={handleLogout}>Đăng xuất</button>
            </div>
          )}
        </div>
      ) : (
        <div className="home-actions">
          <a href="/login">Đăng nhập</a>
          <a href="/register">Đăng ký</a>
        </div>
      )}
    </header>
  )
}

const MAX_AVATAR_SIZE = 10 * 1024 * 1024

const emptyProfile = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: '',
  identityDocumentNumber: '',
  avatarUrl: '',
  role: '',
  memberPoints: 0,
  memberDiscountPercent: 0,
}

function ProfilePage() {
  const storedUser = useMemo(() => getStoredUser(), [])
  const [profile, setProfile] = useState(storedUser || emptyProfile)
  const [formData, setFormData] = useState(storedUser || emptyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!storedUser) {
      window.location.assign('/login?next=/profile')
      return
    }

    const loadProfile = async () => {
      try {
        const data = await getCurrentProfile()
        const normalizedProfile = normalizeProfile(data)
        setProfile(normalizedProfile)
        setFormData(normalizedProfile)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [storedUser])

  const handleChange = (event) => {
    const { name, value } = event.target
    let sanitized = value
    if (name === 'identityDocumentNumber') {
      sanitized = String(value || '').replace(/\D/g, '').slice(0, 12)
    } else if (name === 'phone') {
      sanitized = String(value || '').replace(/\D/g, '').slice(0, 10)
    } else if (name === 'fullName') {
      sanitized = String(value || '').replace(/[^a-zA-ZÀ-ỹ\s]/g, '')
    }
    setFormData((current) => ({
      ...current,
      [name]: sanitized,
    }))
  }

  const handleEdit = () => {
    setMessage('')
    setErrorMessage('')
    setFormData(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
    setMessage('')
    setErrorMessage('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setIsSaving(true)

    try {
      const updatedProfile = await updateCurrentProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address,
        identityDocumentNumber: formData.identityDocumentNumber || null,
      })

      const normalizedProfile = normalizeProfile(updatedProfile)
      setProfile(normalizedProfile)
      setFormData(normalizedProfile)
      setIsEditing(false)
      setMessage('Thông tin cá nhân đã được cập nhật')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.assign('/home')
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMessage('')
      setErrorMessage('Anh dai dien khong duoc vuot qua 10MB')
      event.target.value = ''
      return
    }

    setMessage('')
    setErrorMessage('')
    setIsUploadingAvatar(true)

    try {
      const updatedProfile = await updateCurrentAvatar(file)
      const normalizedProfile = normalizeProfile(updatedProfile)
      setProfile(normalizedProfile)
      setFormData(normalizedProfile)
      setMessage('Ảnh đại diện đã được cập nhật')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ''
    }
  }

  if (!storedUser) {
    return null
  }

  return (
    <div className="profile-page">
      <PublicHeader />

      <section className="profile-shell" aria-labelledby="profile-title">
        <div className="profile-title-row">
          <div>
            <p>Tài khoản</p>
            <h1 id="profile-title">Thông tin cá nhân</h1>
          </div>
          {!isEditing && (
            <button className="profile-primary" type="button" onClick={handleEdit}>
              Chỉnh sửa thông tin cá nhân
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="profile-panel">Đang tải thông tin...</div>
        ) : (
          <>
            {message && <p className="profile-success">{message}</p>}
            {errorMessage && <p className="profile-error">{errorMessage}</p>}

            <section className="profile-summary" aria-label="Tóm tắt hồ sơ">
              <label className="profile-avatar" title="Cập nhật ảnh đại diện">
                <span className="profile-avatar-frame">
                  {profile.avatarUrl ? (
                    <img src={resolveImageUrl(profile.avatarUrl)} alt={profile.fullName || profile.email} />
                  ) : (
                    <span>{getInitials(profile.fullName || profile.email)}</span>
                  )}
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                <span className="profile-camera" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M8 7h8l1.5 2H20v10H4V9h2.5L8 7Z" />
                    <circle cx="12" cy="14" r="3" />
                  </svg>
                </span>
              </label>
              <div className="profile-summary-copy">
                <h2>{profile.fullName || profile.email}</h2>
                <p>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 20V8l8-5 8 5v12" />
                    <path d="M9 20v-6h6v6" />
                  </svg>
                  Thành viên
                </p>
                <span>{profile.role || 'ROLE_CUSTOMER'}</span>
              </div>
              <div className="profile-member-stats" aria-label="Điểm thành viên">
                <div>
                  <span>Điểm tích lũy</span>
                  <strong>{Number(profile.memberPoints || 0).toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  <span>Ưu đãi hiện tại</span>
                  <strong>{Number(profile.memberDiscountPercent || 0).toLocaleString('vi-VN')}%</strong>
                </div>
              </div>
              {isUploadingAvatar && <small>Đang tải ảnh...</small>}
            </section>

            <div className="profile-panel">
            {isEditing ? (
              <form className="profile-form" onSubmit={handleSave}>
                <ProfileInput
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <ProfileInput label="Email" name="email" value={formData.email} readOnly />
                <ProfileInput
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <div className="profile-input">
                  <span>Ngày sinh</span>
                  <DateDropdownPicker
                    isDob={true}
                    value={formData.dateOfBirth}
                    onChange={(val) => setFormData((prev) => ({ ...prev, dateOfBirth: val }))}
                    placeholder="Chọn ngày sinh..."
                  />
                </div>
                <ProfileInput
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
                <ProfileInput
                  label="Căn cước công dân"
                  name="identityDocumentNumber"
                  value={formData.identityDocumentNumber}
                  onChange={handleChange}
                  maxLength={30}
                />
                <div className="profile-form-actions">
                  <button className="profile-secondary" type="button" onClick={handleCancel}>
                    Hủy
                  </button>
                  <button className="profile-primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <ProfileField label="Họ và tên" value={profile.fullName} />
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Số điện thoại" value={profile.phone} />
                <ProfileField label="Ngày sinh" value={formatDateDisplay(profile.dateOfBirth)} />
                <ProfileField label="Địa chỉ" value={profile.address} />
                <ProfileField label="Căn cước công dân" value={profile.identityDocumentNumber} />
                <ProfileField label="Vai trò" value={profile.role} />
                <ProfileField label="Điểm thành viên" value={Number(profile.memberPoints || 0).toLocaleString('vi-VN')} />
                <ProfileField label="Ưu đãi thành viên" value={`${Number(profile.memberDiscountPercent || 0).toLocaleString('vi-VN')}%`} />
              </div>
            )}
          </div>
          </>
        )}
      </section>
    </div>
  )
}

function ProfileInput({ label, type = 'text', ...props }) {
  return (
    <label className="profile-input">
      <span>{label}</span>
      <input type={type} {...props} />
    </label>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span>{label}</span>
      <strong>{value || 'Chưa cập nhật'}</strong>
    </div>
  )
}

function normalizeProfile(profile) {
  return {
    ...emptyProfile,
    ...profile,
    dateOfBirth: profile?.dateOfBirth || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    identityDocumentNumber: profile?.identityDocumentNumber || '',
    avatarUrl: profile?.avatarUrl || '',
    memberPoints: profile?.memberPoints || 0,
    memberDiscountPercent: profile?.memberDiscountPercent || 0,
  }
}

function getInitials(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default ProfilePage
