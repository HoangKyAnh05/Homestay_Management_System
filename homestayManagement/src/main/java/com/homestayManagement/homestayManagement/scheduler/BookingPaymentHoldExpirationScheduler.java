package com.homestayManagement.homestayManagement.scheduler;

import com.homestayManagement.homestayManagement.entity.Booking;
import com.homestayManagement.homestayManagement.entity.BookingDetail;
import com.homestayManagement.homestayManagement.entity.Voucher;
import com.homestayManagement.homestayManagement.repository.BookingDetailRepository;
import com.homestayManagement.homestayManagement.repository.BookingRepository;
import com.homestayManagement.homestayManagement.repository.VoucherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingPaymentHoldExpirationScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingPaymentHoldExpirationScheduler.class);
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final VoucherRepository voucherRepository;

    public BookingPaymentHoldExpirationScheduler(
            BookingRepository bookingRepository,
            BookingDetailRepository bookingDetailRepository,
            VoucherRepository voucherRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingDetailRepository = bookingDetailRepository;
        this.voucherRepository = voucherRepository;
    }

    /**
     * Tự động quét và giải phóng các đơn PENDING quá hạn thanh toán (sau 5 phút) mỗi 30 giây
     */
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void releaseExpiredPendingBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> pendingBookings = bookingRepository.findAll().stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                .filter(b -> {
                    LocalDateTime expiresAt = b.getPaymentHoldExpiresAt() != null
                            ? b.getPaymentHoldExpiresAt()
                            : (b.getBookingDate() != null ? b.getBookingDate().plusMinutes(5) : null);
                    return expiresAt != null && now.isAfter(expiresAt);
                })
                .toList();

        if (pendingBookings.isEmpty()) {
            return;
        }

        for (Booking booking : pendingBookings) {
            log.info("Đang tự động hủy đơn hết hạn thanh toán 5 phút và giải phóng phòng: ID={}, Code={}", booking.getId(), booking.getBookingCode());
            booking.setStatus("CANCELLED");
            booking.setCancellationReason("Quá hạn thanh toán 5 phút");
            booking.setCancelledAt(now);
            bookingRepository.save(booking);

            List<BookingDetail> details = bookingDetailRepository.findByBookingId(booking.getId());
            details.forEach(d -> d.setStatus("CANCELLED"));
            bookingDetailRepository.saveAll(details);

            if (booking.getVoucher() != null) {
                Voucher v = booking.getVoucher();
                if (v.getUsedCount() != null && v.getUsedCount() > 0) {
                    v.setUsedCount(v.getUsedCount() - 1);
                    voucherRepository.save(v);
                }
            }
        }
    }
}
