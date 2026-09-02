package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fixed_fund_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedFundConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Số tiền quỹ cố định tại quầy (VNĐ)
    @Builder.Default
    @Column(name = "fund_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal fundAmount = BigDecimal.valueOf(1000000);

    // Chế độ quỹ đầu ca:
    // FIXED: Mỗi ca luôn bắt đầu bằng đúng số tiền quỹ cố định này (tiền dôi dư ca trước nộp lại)
    // ACCUMULATIVE: Kế thừa thực tế từ ca trước bàn giao (người sau nhận full tiền ca trước)
    @Builder.Default
    @Column(name = "fund_mode", nullable = false, length = 30)
    private String fundMode = "ACCUMULATIVE";

    @Column(name = "description", length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_employee_id")
    private Employee updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
