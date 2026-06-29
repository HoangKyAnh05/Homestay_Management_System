package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "payment_hold_expires_at")
    private LocalDateTime paymentHoldExpiresAt;

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
