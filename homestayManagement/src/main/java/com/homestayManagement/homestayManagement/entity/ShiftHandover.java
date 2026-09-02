package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_handovers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhân viên giao ca (người trước)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outgoing_staff_id", nullable = false)
    private Employee outgoingStaff;

    // Nhân viên nhận ca (người sau)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incoming_staff_id", nullable = false)
    private Employee incomingStaff;

    // Thời điểm giao ca
    @Column(name = "handover_time", nullable = false)
    private LocalDateTime handoverTime;

    // Tiền mặt ban đầu trong két (nhận từ ca trước)
    @Builder.Default
    @Column(name = "initial_cash", precision = 14, scale = 2)
    private BigDecimal initialCash = BigDecimal.ZERO;

    // Tiền mặt thu được theo hệ thống ghi nhận trong ca
    @Builder.Default
    @Column(name = "system_cash", precision = 14, scale = 2)
    private BigDecimal systemCash = BigDecimal.ZERO;

    // Tiền mặt thực tế đếm được khi bàn giao
    @Builder.Default
    @Column(name = "actual_cash", precision = 14, scale = 2)
    private BigDecimal actualCash = BigDecimal.ZERO;

    // Trạng thái đối soát: ENOUGH (Đủ), SHORTAGE (Thiếu)
    @Builder.Default
    @Column(name = "cash_status", nullable = false, length = 20)
    private String cashStatus = "ENOUGH";

    // Số tiền thiếu (nếu có)
    @Column(name = "shortage_amount", precision = 14, scale = 2)
    private BigDecimal shortageAmount;

    // Lý do thiếu
    @Column(name = "shortage_reason", length = 500)
    private String shortageReason;

    // Thời hạn bù tiền
    @Column(name = "compensation_deadline")
    private LocalDateTime compensationDeadline;

    // Trạng thái bù tiền: NONE (khi đủ), PENDING (chờ bù), RESOLVED (đã bù)
    @Builder.Default
    @Column(name = "compensation_status", nullable = false, length = 20)
    private String compensationStatus = "NONE";

    // Ghi chú khi đã bù tiền
    @Column(name = "compensation_notes", length = 500)
    private String compensationNotes;

    // Thời điểm bù tiền xong
    @Column(name = "compensation_resolved_at")
    private LocalDateTime compensationResolvedAt;

    // Trạng thái ca: ACTIVE (đang trong ca), HANDED_OVER (đã bàn giao sang ca tiếp theo)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    // Ghi chú bàn giao ca chung
    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (handoverTime == null) {
            handoverTime = LocalDateTime.now();
        }
    }
}
