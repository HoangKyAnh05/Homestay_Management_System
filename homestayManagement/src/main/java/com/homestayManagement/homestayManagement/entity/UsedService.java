package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "used_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsedService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_record_id", nullable = false)
    private CheckInRecord checkInRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "price_at_use", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtUse; // Snapshot giá dịch vụ tại thời điểm gọi

    @Column(name = "order_time", nullable = false)
    private LocalDateTime orderTime;

    @PrePersist
    protected void onCreate() {
        if (orderTime == null) orderTime = LocalDateTime.now();
    }
}
