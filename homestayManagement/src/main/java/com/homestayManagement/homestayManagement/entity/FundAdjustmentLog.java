package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fund_adjustment_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundAdjustmentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "old_amount", precision = 14, scale = 2)
    private BigDecimal oldAmount;

    @Column(name = "new_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal newAmount;

    @Column(name = "old_mode", length = 30)
    private String oldMode;

    @Column(name = "new_mode", length = 30)
    private String newMode;

    @Column(name = "reason", length = 500)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjusted_by_employee_id")
    private Employee adjustedBy;

    @Column(name = "adjusted_at", nullable = false)
    private LocalDateTime adjustedAt;

    @PrePersist
    protected void onCreate() {
        if (this.adjustedAt == null) {
            this.adjustedAt = LocalDateTime.now();
        }
    }
}
