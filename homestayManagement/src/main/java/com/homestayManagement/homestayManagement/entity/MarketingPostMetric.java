package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_post_metrics", indexes = {
        @Index(name = "idx_marketing_post_metrics_channel", columnList = "channel_id"),
        @Index(name = "idx_marketing_post_metrics_collected_at", columnList = "collected_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingPostMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "channel_id", nullable = false)
    private MarketingPostChannel channel;

    private Long reach;

    private Long impressions;

    private Long likes;

    private Long comments;

    private Long shares;

    private Long saves;

    @Column(name = "engagement_rate", precision = 7, scale = 4)
    private BigDecimal engagementRate;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @PrePersist
    protected void onCreate() {
        if (collectedAt == null) {
            collectedAt = LocalDateTime.now();
        }
    }
}
