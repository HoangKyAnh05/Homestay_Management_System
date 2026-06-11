package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "check_in_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_detail_id", nullable = false, unique = true)
    private BookingDetail bookingDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "housekeeping_id")
    private Employee housekeeping;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receptionist_id")
    private Employee receptionist;

    @Column(name = "actual_check_in", nullable = false)
    private LocalDateTime actualCheckIn;

    @Column(name = "actual_check_out")
    private LocalDateTime actualCheckOut;

    @Builder.Default
    @Column(name = "early_check_in_fee", precision = 10, scale = 2)
    private BigDecimal earlyCheckInFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "late_check_out_fee", precision = 10, scale = 2)
    private BigDecimal lateCheckOutFee = BigDecimal.ZERO;
}
