package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_posts", indexes = {
        @Index(name = "idx_marketing_posts_status", columnList = "status"),
        @Index(name = "idx_marketing_posts_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String brief;

    @Column(name = "target_audience", length = 300)
    private String targetAudience;

    @Column(length = 100)
    private String goal;

    @Column(length = 100)
    private String tone;

    @Column(name = "content_length", length = 30)
    private String contentLength;

    @Column(name = "source_type", length = 30)
    private String sourceType;

    @Builder.Default
    @Column(name = "approval_status", nullable = false, length = 30)
    private String approvalStatus = "PENDING";

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private MarketingCampaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private Employee creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private Employee approvedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_config_id")
    private AiAgentConfig agentConfig;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
