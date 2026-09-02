package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(
        name = "bookings",
        indexes = @Index(name = "idx_bookings_booking_date", columnList = "booking_date"),
        uniqueConstraints = @UniqueConstraint(name = "uk_bookings_booking_code", columnNames = "booking_code")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    private static final DateTimeFormatter FALLBACK_CODE_DATE_FORMAT = DateTimeFormatter.ofPattern("ddMMyyyy");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", length = 32, unique = true)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deposit_policy_id")
    private DepositPolicy depositPolicy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @Column(name = "voucher_code", length = 20)
    private String voucherCode;

    @Column(name = "voucher_discount_type", length = 20)
    private String voucherDiscountType;

    @Column(name = "voucher_discount_value", precision = 10, scale = 2)
    private BigDecimal voucherDiscountValue;

    @Builder.Default
    @Column(name = "room_charge_before_discount", nullable = false, precision = 10, scale = 2)
    private BigDecimal roomChargeBeforeDiscount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "room_discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal roomDiscountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "member_discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal memberDiscountPercent = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "member_discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal memberDiscountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "earned_member_points", nullable = false)
    private Integer earnedMemberPoints = 0;

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "payment_hold_expires_at")
    private LocalDateTime paymentHoldExpiresAt;

    @Builder.Default
    @Column(name = "customer_confirmed", nullable = false)
    private boolean customerConfirmed = false;

    @Column(name = "customer_feedback", length = 1000)
    private String customerFeedback;

    @Column(name = "customer_feedback_at")
    private LocalDateTime customerFeedbackAt;

    @Column(name = "cancellation_reason", length = 1000)
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "refund_rate")
    private Integer refundRate;

    @Builder.Default
    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "refund_status", length = 30)
    private String refundStatus = "NO_REFUND";

    @Column(name = "refund_info", length = 500)
    private String refundInfo;

    @Column(name = "refund_completed_at")
    private LocalDateTime refundCompletedAt;

    @Column(name = "refund_handled_by", length = 100)
    private String refundHandledBy;

    public String getBookingCode() {
        if (bookingCode != null && !bookingCode.isBlank()) {
            return bookingCode;
        }
        if (bookingDate != null && id != null) {
            return "BK_" + bookingDate.format(FALLBACK_CODE_DATE_FORMAT) + "_" + id;
        }
        return bookingCode;
    }

    @PrePersist
    protected void onCreate() {
        if (bookingDate == null) {
            bookingDate = LocalDateTime.now();
        }
    }
}
