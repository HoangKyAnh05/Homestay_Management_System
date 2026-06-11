package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20)
    private String platform;

    @Column(name = "generated_content", columnDefinition = "TEXT")
    private String generatedContent;

    @Column(name = "media_url", length = 255)
    private String mediaUrl;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(length = 20)
    private String status;

    @Column(name = "external_post_id", length = 100)
    private String externalPostId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private Employee creator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_config_id")
    private AiAgentConfig agentConfig;
}
