import React, { useState } from 'react'
import CustomDateTimePicker from '../../components/DateTimePicker/CustomDateTimePicker'
import RoomScheduleCalendarModal from '../../components/RoomScheduleCalendar/RoomScheduleCalendarModal'

export default function CalendarShowcasePage() {
  const [val1, setVal1] = useState('2026-09-14T14:00')
  const [val2, setVal2] = useState('2026-09-14T14:00')
  const [val3, setVal3] = useState('2026-09-14T14:00')
  const [val4, setVal4] = useState('2026-09-14T14:00')
  const [val5, setVal5] = useState('2026-09-14T14:00')
  const [val6, setVal6] = useState('2026-09-14T14:00')
  const [val7In, setVal7In] = useState('2026-09-16T14:00')
  const [val7Out, setVal7Out] = useState('2026-09-19T12:00')
  const [val8Out, setVal8Out] = useState('2026-09-20T12:00')

  const [val9, setVal9] = useState('2026-09-14T14:00')
  const [val10, setVal10] = useState('2026-09-14T14:00')
  const [val11, setVal11] = useState('2026-09-14T14:00')

  const [modal1Open, setModal1Open] = useState(true)
  const [modal2Open, setModal2Open] = useState(false)

  // Sample data sets
  const slotsBooked = [
    { checkInTarget: '2026-09-16T14:00:00', checkOutTarget: '2026-09-18T12:00:00', status: 'CONFIRMED', roomId: 1 },
    { checkInTarget: '2026-09-22T14:00:00', checkOutTarget: '2026-09-25T12:00:00', status: 'CONFIRMED', roomId: 1 },
  ]

  const slotsMaintenance = [
    { checkInTarget: '2026-09-15T14:00:00', checkOutTarget: '2026-09-17T12:00:00', status: 'MAINTENANCE', bookingDetailId: -1, roomId: 1 },
    { checkInTarget: '2026-09-25T14:00:00', checkOutTarget: '2026-09-28T12:00:00', status: 'MAINTENANCE', bookingDetailId: -1, roomId: 1 },
  ]

  const slotsDirty = [
    { checkInTarget: '2026-09-15T14:00:00', checkOutTarget: '2026-09-16T12:00:00', status: 'DIRTY', roomId: 1 },
  ]

  const slotsStay = [
    { checkInTarget: '2026-09-14T14:00:00', checkOutTarget: '2026-09-17T12:00:00', status: 'CHECKED_IN', roomId: 1 },
  ]

  const slotsPending = [
    { checkInTarget: '2026-09-18T14:00:00', checkOutTarget: '2026-09-20T12:00:00', status: 'PENDING', roomId: 1 },
  ]

  const threeRooms = [
    { id: 101, roomNumber: '101', roomTypeName: 'VIP King Deluxe' },
    { id: 102, roomNumber: '102', roomTypeName: 'Deluxe View Núi' },
    { id: 103, roomNumber: '103', roomTypeName: 'Standard Ban Công' },
  ]

  const slotsPartialBusy = [
    // Room 101 booked 16-18
    { checkInTarget: '2026-09-16T14:00:00', checkOutTarget: '2026-09-18T12:00:00', status: 'CONFIRMED', roomId: 101, roomNumber: '101' },
    // Room 102 booked 16-18
    { checkInTarget: '2026-09-16T14:00:00', checkOutTarget: '2026-09-18T12:00:00', status: 'CONFIRMED', roomId: 102, roomNumber: '102' },
    // Room 103 booked 22-24
    { checkInTarget: '2026-09-22T14:00:00', checkOutTarget: '2026-09-24T12:00:00', status: 'CONFIRMED', roomId: 103, roomNumber: '103' },
  ]

  const slotsAllBusy = [
    { checkInTarget: '2026-09-18T14:00:00', checkOutTarget: '2026-09-21T12:00:00', status: 'CONFIRMED', roomId: 101, roomNumber: '101' },
    { checkInTarget: '2026-09-18T14:00:00', checkOutTarget: '2026-09-21T12:00:00', status: 'CONFIRMED', roomId: 102, roomNumber: '102' },
    { checkInTarget: '2026-09-18T14:00:00', checkOutTarget: '2026-09-21T12:00:00', status: 'CONFIRMED', roomId: 103, roomNumber: '103' },
  ]

  const modalBusySlots = [
    { bookingDetailId: 101, checkInTarget: '2026-09-14T14:00:00', checkOutTarget: '2026-09-17T12:00:00', status: 'CHECKED_IN' },
    { bookingDetailId: 102, checkInTarget: '2026-09-18T14:00:00', checkOutTarget: '2026-09-20T12:00:00', status: 'PENDING' },
    { bookingDetailId: 103, checkInTarget: '2026-09-21T14:00:00', checkOutTarget: '2026-09-23T12:00:00', status: 'DIRTY' },
    { bookingDetailId: 104, checkInTarget: '2026-09-24T14:00:00', checkOutTarget: '2026-09-26T12:00:00', status: 'MAINTENANCE' },
    { bookingDetailId: 105, checkInTarget: '2026-09-27T14:00:00', checkOutTarget: '2026-09-29T12:00:00', status: 'CONFIRMED' },
  ]

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', color: '#0f172a', margin: '0 0 8px 0' }}>
          🗓️ Showcase Tất Cả Trường Hợp Khả Dụng Lịch Đặt Phòng
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
          Đảm bảo không bao giờ bị hiển thị sai tình trạng phòng (Available vs Busy vs Maintenance vs Stay vs Pending vs Multi-room).
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        {/* Case 1 */}
        <div id="case-1" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#059669', marginTop: 0 }}>Case 1: Phòng đơn - Toàn bộ tháng trống (Trống)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Không có lịch bận nào, toàn bộ ngày tương lai đều sẵn sàng đón khách.</p>
          <CustomDateTimePicker
            value={val1}
            onChange={setVal1}
            busySlots={[]}
            isCheckIn={true}
            ariaLabel="Case 1 CheckIn"
          />
        </div>

        {/* Case 2 */}
        <div id="case-2" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#dc2626', marginTop: 0 }}>Case 2: Phòng đơn - Đã có khách đặt (Đã đặt)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Các ngày 16-18, 22-25 có khách cọc/thanh toán, hiển thị tag "Đã đặt".</p>
          <CustomDateTimePicker
            value={val2}
            onChange={setVal2}
            busySlots={slotsBooked}
            isCheckIn={true}
            ariaLabel="Case 2 CheckIn"
          />
        </div>

        {/* Case 3 */}
        <div id="case-3" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#991b1b', marginTop: 0 }}>Case 3: Phòng đơn - Phòng gặp sự cố kỹ thuật (Bảo trì)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Phòng bị hỏng thiết bị, hệ thống khóa không cho book với tag "Bảo trì".</p>
          <CustomDateTimePicker
            value={val3}
            onChange={setVal3}
            busySlots={slotsMaintenance}
            isCheckIn={true}
            ariaLabel="Case 3 CheckIn"
          />
        </div>

        {/* Case 4 */}
        <div id="case-4" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#c2410c', marginTop: 0 }}>Case 4: Phòng đơn - Khách vừa trả phòng (Chờ dọn)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Buồng phòng đang dọn dẹp và nghiệm thu với tag "Chờ dọn".</p>
          <CustomDateTimePicker
            value={val4}
            onChange={setVal4}
            busySlots={slotsDirty}
            isCheckIn={true}
            ariaLabel="Case 4 CheckIn"
          />
        </div>

        {/* Case 5 */}
        <div id="case-5" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#0369a1', marginTop: 0 }}>Case 5: Phòng đơn - Đang có khách lưu trú (Đang ở)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Khách thực tế đang check-in ở tại phòng với tag "Đang ở".</p>
          <CustomDateTimePicker
            value={val5}
            onChange={setVal5}
            busySlots={slotsStay}
            isCheckIn={true}
            ariaLabel="Case 5 CheckIn"
          />
        </div>

        {/* Case 6 */}
        <div id="case-6" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#854d0e', marginTop: 0 }}>Case 6: Phòng đơn - Khách đang giữ chỗ 5 phút (Giữ chỗ)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Khách đang trong luồng thanh toán tạm với tag "Giữ chỗ".</p>
          <CustomDateTimePicker
            value={val6}
            onChange={setVal6}
            busySlots={slotsPending}
            isCheckIn={true}
            ariaLabel="Case 6 CheckIn"
          />
        </div>

        {/* Case 7 */}
        <div id="case-7" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#15573a', marginTop: 0 }}>Case 7: Phòng đơn - Khoảng ngày đang chọn (Nhận / Trả / In-Range)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Đang chọn Check-in 16/09 (14h) đến Check-out 19/09 (11h).</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CustomDateTimePicker
              value={val7In}
              onChange={setVal7In}
              checkInValue={val7In}
              checkOutValue={val7Out}
              isCheckIn={true}
              ariaLabel="Case 7 CheckIn"
            />
            <CustomDateTimePicker
              value={val7Out}
              onChange={setVal7Out}
              checkInValue={val7In}
              checkOutValue={val7Out}
              isCheckIn={false}
              ariaLabel="Case 7 CheckOut"
            />
          </div>
        </div>

        {/* Case 8 */}
        <div id="case-8" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#64748b', marginTop: 0 }}>Case 8: Phòng đơn - Ngày quá khứ & Khóa ngày trả phòng trước ngày đến</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Các ngày trước hôm nay hiển thị số mờ không bị cắt chữ, các ngày &le; ngày đến bị Khóa.</p>
          <CustomDateTimePicker
            value={val8Out}
            onChange={setVal8Out}
            checkInValue="2026-09-18T14:00"
            isCheckIn={false}
            ariaLabel="Case 8 CheckOut"
          />
        </div>

        {/* Case 9 */}
        <div id="case-9" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#059669', marginTop: 0 }}>Case 9: Đặt nhiều phòng (3 phòng) - Trống toàn bộ (Trống 3P)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Đang chọn P.101, P.102, P.103. Toàn bộ các ngày đều trống cả 3 phòng.</p>
          <CustomDateTimePicker
            value={val9}
            onChange={setVal9}
            rooms={threeRooms}
            busySlots={[]}
            isCheckIn={true}
            ariaLabel="Case 9 MultiFree"
          />
        </div>

        {/* Case 10 */}
        <div id="case-10" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#d97706', marginTop: 0 }}>Case 10: Đặt nhiều phòng (3 phòng) - Kín 1 phần / Kín cục bộ (Kín 2/3P)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Ngày 16-18 kín P.101, P.102 nhưng P.103 còn trống &rarr; Tag "Kín 2/3P" màu cam cảnh báo.</p>
          <CustomDateTimePicker
            value={val10}
            onChange={setVal10}
            rooms={threeRooms}
            busySlots={slotsPartialBusy}
            isCheckIn={true}
            ariaLabel="Case 10 MultiPartial"
          />
        </div>

        {/* Case 11 */}
        <div id="case-11" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '15px', color: '#dc2626', marginTop: 0 }}>Case 11: Đặt nhiều phòng (3 phòng) - Kín toàn bộ (Kín cả 3P)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Ngày 18-21 tất cả 3 phòng đều đã có khách &rarr; Tag "Kín cả 3P" màu đỏ.</p>
          <CustomDateTimePicker
            value={val11}
            onChange={setVal11}
            rooms={threeRooms}
            busySlots={slotsAllBusy}
            isCheckIn={true}
            ariaLabel="Case 11 MultiAllBusy"
          />
        </div>
      </div>

      {/* Case 12 & 13 Controls for Modals */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', color: '#0f172a', marginTop: 0 }}>Modals Lịch Chi Tiết Phòng (RoomScheduleCalendarModal)</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            id="open-modal-1"
            onClick={() => { setModal1Open(true); setModal2Open(false) }}
            style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Case 12: Mở Lịch chi tiết phòng có đợt đặt & trạng thái đầy đủ
          </button>
          <button
            type="button"
            id="open-modal-2"
            onClick={() => { setModal2Open(true); setModal1Open(false) }}
            style={{ padding: '10px 18px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Case 13: Mở Lịch chi tiết phòng tháng hoàn toàn trống
          </button>
        </div>
      </div>

      {modal1Open && (
        <div id="case-12">
          <RoomScheduleCalendarModal
            room={{ id: 1, name: 'Phòng VIP King View Núi', roomNumber: '201' }}
            initialBusySlots={modalBusySlots}
            currentCheckIn="2026-09-14T14:00"
            currentCheckOut="2026-09-15T11:00"
            onClose={() => setModal1Open(false)}
          />
        </div>
      )}

      {modal2Open && (
        <div id="case-13">
          <RoomScheduleCalendarModal
            room={{ id: 2, name: 'Phòng Deluxe Gia Đình', roomNumber: '302' }}
            initialBusySlots={[]}
            currentCheckIn="2026-09-14T14:00"
            currentCheckOut="2026-09-15T11:00"
            onClose={() => setModal2Open(false)}
          />
        </div>
      )}
    </div>
  )
}
