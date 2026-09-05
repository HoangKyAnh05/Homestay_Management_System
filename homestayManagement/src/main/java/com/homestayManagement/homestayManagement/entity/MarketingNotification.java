package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketing_notifications", indexes = {
        @Index(name = "idx_marketing_notifications_read", columnList = "is_read"),
        @Index(name = "idx_marketing_notifications_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false, length = 50)
    private String type; // "LIKE", "COMMENT", "SHARE", "REACTION"

    @Column(length = 50)
    private String platform; // "FACEBOOK", "YOUTUBE"

    @Column(name = "channel_id")
    private Long channelId;

    @Column(name = "post_title", length = 255)
    private String postTitle;

    @Column(name = "actor_name", length = 150)
    private String actorName;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}
