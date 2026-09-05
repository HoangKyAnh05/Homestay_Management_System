package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "giveaway_leads", indexes = {
        @Index(name = "idx_giveaway_phone", columnList = "phone"),
        @Index(name = "idx_giveaway_status", columnList = "status"),
        @Index(name = "idx_giveaway_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiveawayLead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(name = "travel_plan", length = 100)
    private String travelPlan;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "prize_name", nullable = false, length = 150)
    private String prizeName;

    @Column(name = "prize_code", length = 50)
    private String prizeCode;

    @Builder.Default
    @Column(name = "discount_percent")
    private Integer discountPercent = 0;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "NEW"; // NEW, CONTACTED, BOOKED, CANCELLED

    @Column(name = "staff_note", columnDefinition = "TEXT")
    private String staffNote;

    @Column(name = "spin_token", length = 100)
    private String spinToken;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
