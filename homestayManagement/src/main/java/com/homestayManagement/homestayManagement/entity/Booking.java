package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "booking_date", nullable = false)
    private LocalDateTime bookingDate;

    @Column(name = "check_in_target", nullable = false)
    private LocalDate checkInTarget;

    @Column(name = "check_out_target", nullable = false)
    private LocalDate checkOutTarget;

    @Column(name = "base_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseAmount;

    @Builder.Default
    @Column(name = "deposit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    // PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @PrePersist
    protected void onCreate() {
        if (bookingDate == null) bookingDate = LocalDateTime.now();
    }
}
