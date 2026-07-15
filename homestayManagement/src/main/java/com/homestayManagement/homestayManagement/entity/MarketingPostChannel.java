package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_post_channels", indexes = {
        @Index(name = "idx_marketing_post_channels_status", columnList = "status"),
        @Index(name = "idx_marketing_post_channels_platform", columnList = "platform"),
        @Index(name = "idx_marketing_post_channels_scheduled_at", columnList = "scheduled_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingPostChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private MarketingPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "social_account_id")
    private SocialAccount socialAccount;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(name = "page_name", length = 120)
    private String pageName;

    @Column(name = "page_url", length = 500)
    private String pageUrl;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String hashtags;

    @Column(name = "platform_option_json", columnDefinition = "TEXT")
    private String platformOptionJson;

    @Column(name = "relay_flow_id", length = 160)
    private String relayFlowId;

    @Column(name = "relay_task_id", length = 160)
    private String relayTaskId;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "external_post_id", length = 160)
    private String externalPostId;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
