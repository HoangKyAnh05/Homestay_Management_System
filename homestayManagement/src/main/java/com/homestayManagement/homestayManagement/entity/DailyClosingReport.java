package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_closing_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyClosingReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Employee staff;

    @Column(name = "staff_username", length = 100)
    private String staffUsername;

    @Column(name = "staff_full_name", length = 150)
    private String staffFullName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "total_revenue", precision = 14, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cash_revenue", precision = 14, scale = 2)
    private BigDecimal cashRevenue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "transfer_revenue", precision = 14, scale = 2)
    private BigDecimal transferRevenue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "occupied_rooms_count")
    private Integer occupiedRoomsCount = 0;

    @Builder.Default
    @Column(name = "check_in_today_count")
    private Integer checkInTodayCount = 0;

    @Builder.Default
    @Column(name = "check_out_today_count")
    private Integer checkOutTodayCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // SUBMITTED, ACKNOWLEDGED
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "SUBMITTED";

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "snapshot_data_json", columnDefinition = "LONGTEXT")
    private String snapshotDataJson;
}
