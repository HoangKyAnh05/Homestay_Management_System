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

    // Nullable: khách vãng lai thuê trực tiếp chưa có booking trước
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", unique = true)
    private Booking booking;

    @Column(name = "actual_check_in")
    private LocalDateTime actualCheckIn; // So với 14:00 để tính phí check-in sớm

    @Column(name = "actual_check_out")
    private LocalDateTime actualCheckOut; // So với 12:00 để tính phí check-out muộn

    @Builder.Default
    @Column(name = "early_check_in_fee", precision = 10, scale = 2)
    private BigDecimal earlyCheckInFee = BigDecimal.ZERO;

    // Rule: trước 15h = 30%, trước 18h = 50%, sau 18h = 100% giá phòng
    @Builder.Default
    @Column(name = "late_check_out_fee", precision = 10, scale = 2)
    private BigDecimal lateCheckOutFee = BigDecimal.ZERO;
}
