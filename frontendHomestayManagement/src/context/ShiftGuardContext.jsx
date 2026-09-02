import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getStoredUser, getStoredToken } from '../services/authService'
import { getCurrentShiftStatus } from '../services/shiftService'

export const ShiftGuardContext = createContext({
  isInShift: true,
  isReceptionist: false,
  shiftStatus: null,
  loadingShift: false,
  openHandoverModal: () => {},
  guardAction: (fn, actionName) => {
    if (typeof fn === 'function') fn()
  },
  refreshShiftStatus: async () => {},
})

export function useShiftGuard() {
  return useContext(ShiftGuardContext)
}

export function ShiftGuardProvider({ children, onOpenHandoverModal }) {
  const user = getStoredUser()
  const role = user?.role || ''
  const isReceptionist = role === 'ROLE_RECEPTIONIST'

  const [shiftStatus, setShiftStatus] = useState(null)
  const [loadingShift, setLoadingShift] = useState(false)
  const [guardModalInfo, setGuardModalInfo] = useState(null) // { actionName, isOpen: true }

  const refreshShiftStatus = useCallback(async () => {
    const token = getStoredToken()
    if (!token || !isReceptionist) return
    setLoadingShift(true)
    try {
      const data = await getCurrentShiftStatus()
      setShiftStatus(data)
    } catch {
      // ignore
    } finally {
      setLoadingShift(false)
    }
  }, [isReceptionist])

  useEffect(() => {
    if (isReceptionist) {
      refreshShiftStatus()
    }
  }, [isReceptionist, refreshShiftStatus])

  // Lễ tân được coi là ở trong ca nếu backend trả về isCurrentStaffInShift = true
  // Các role khác (Admin, Housekeeping...) luôn có isInShift = true
  const isInShift = !isReceptionist || Boolean(shiftStatus?.isCurrentStaffInShift)

  const openHandoverModal = useCallback(() => {
    if (typeof onOpenHandoverModal === 'function') {
      onOpenHandoverModal()
    }
  }, [onOpenHandoverModal])

  const guardAction = useCallback((actionFn, actionName = 'thao tác này') => {
    if (isInShift) {
      if (typeof actionFn === 'function') actionFn()
    } else {
      setGuardModalInfo({ actionName, isOpen: true })
    }
  }, [isInShift])

  const closeGuardModal = () => setGuardModalInfo(null)

  const handleProceedToHandover = () => {
    closeGuardModal()
    openHandoverModal()
  }

  return (
    <ShiftGuardContext.Provider
      value={{
        isInShift,
        isReceptionist,
        shiftStatus,
        loadingShift,
        openHandoverModal,
        guardAction,
        refreshShiftStatus,
      }}
    >
      {children}

      {/* Popup cảnh báo khi Lễ tân chưa nhận ca mà cố gắng chỉnh sửa */}
      {guardModalInfo?.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: 20,
          }}
          onClick={closeGuardModal}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #fed7aa',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#fff7ed',
                border: '2px solid #ffedd5',
                color: '#ea580c',
                fontSize: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              🔒
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: 19, color: '#1e293b', fontWeight: 700 }}>
              Yêu cầu Nhận Ca Trực
            </h3>

            <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: 14, lineHeight: 1.5 }}>
              Bạn đang ở <strong>Chế độ Chỉ Xem</strong> do chưa hoàn tất nhận bàn giao ca làm việc.
              Để thực hiện <strong>{guardModalInfo.actionName}</strong> và ghi nhận doanh thu chính xác, vui lòng đối soát quỹ và điền biên bản giao ca.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={closeGuardModal}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Để sau (Chỉ xem)
              </button>

              <button
                type="button"
                onClick={handleProceedToHandover}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📝 Đối soát & Nhận ca ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ShiftGuardContext.Provider>
  )
}
