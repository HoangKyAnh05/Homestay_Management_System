package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "housekeeping_tasks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_housekeeping_task_check_in", columnNames = "check_in_record_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HousekeepingTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_record_id", nullable = false, unique = true)
    private CheckInRecord checkInRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_employee_id", nullable = false)
    private Employee requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_housekeeping_id")
    private Employee assignedHousekeeping;

    @Builder.Default
    @Column(name = "inspection_status", nullable = false, length = 20)
    private String inspectionStatus = "PENDING";

    @Builder.Default
    @Column(name = "cleaning_status", nullable = false, length = 20)
    private String cleaningStatus = "PENDING";

    @Column(length = 1000)
    private String note;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "inspection_completed_at")
    private LocalDateTime inspectionCompletedAt;

    @Column(name = "cleaning_completed_at")
    private LocalDateTime cleaningCompletedAt;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (requestedAt == null) requestedAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
