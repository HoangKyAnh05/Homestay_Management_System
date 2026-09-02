package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_detail_id")
    private BookingDetail bookingDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "housekeeping_task_id")
    private HousekeepingTask housekeepingTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private Employee reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by_id")
    private Employee handledBy;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    // DAMAGED, LOST
    @Column(name = "incident_type", nullable = false, length = 50)
    private String incidentType;

    // LOW, MEDIUM, HIGH, CRITICAL
    @Builder.Default
    @Column(nullable = false, length = 50)
    private String severity = "MEDIUM";

    @Column(length = 1000)
    private String description;

    @Column(name = "evidence_image_url", length = 500)
    private String evidenceImageUrl;

    // REPORTED, IN_PROGRESS, RESOLVED, DISMISSED
    @Builder.Default
    @Column(nullable = false, length = 50)
    private String status = "REPORTED";

    // CUSTOMER, HOMESTAY, NONE
    @Column(length = 50)
    private String liability;

    @Column(name = "estimated_cost", precision = 12, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "compensation_amount", precision = 12, scale = 2)
    private BigDecimal compensationAmount;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        if (this.reportedAt == null) {
            this.reportedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "REPORTED";
        }
        if (this.severity == null) {
            this.severity = "MEDIUM";
        }
        if (this.quantity == null || this.quantity <= 0) {
            this.quantity = 1;
        }
    }
}
