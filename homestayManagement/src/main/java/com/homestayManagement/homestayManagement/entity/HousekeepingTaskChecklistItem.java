package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "housekeeping_task_checklist_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_housekeeping_task_checklist_order", columnNames = {"housekeeping_task_id", "display_order"})
}, indexes = {
        @Index(name = "idx_housekeeping_task_checklist_task", columnList = "housekeeping_task_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HousekeepingTaskChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "housekeeping_task_id", nullable = false)
    private HousekeepingTask housekeepingTask;

    @Column(name = "source_template_item_id")
    private Long sourceTemplateItemId;

    @Column(name = "title_snapshot", nullable = false, length = 200)
    private String titleSnapshot;

    @Column(name = "description_snapshot", length = 500)
    private String descriptionSnapshot;

    @Column(name = "is_required", nullable = false)
    private boolean required;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Builder.Default
    @Column(name = "is_completed", nullable = false)
    private boolean completed = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_employee_id")
    private Employee completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
