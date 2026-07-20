package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "social_oauth_apps", indexes = {
        @Index(name = "idx_social_oauth_apps_platform", columnList = "platform")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialOAuthApp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30, unique = true)
    private String platform;

    @Column(name = "client_id", nullable = false, length = 255)
    private String clientId;

    @Column(name = "client_secret", nullable = false, columnDefinition = "TEXT")
    private String clientSecret;

    @Column(name = "auth_url", nullable = false, length = 500)
    private String authUrl;

    @Column(name = "token_url", nullable = false, length = 500)
    private String tokenUrl;

    @Column(name = "redirect_uri", nullable = false, length = 500)
    private String redirectUri;

    @Column(columnDefinition = "TEXT")
    private String scopes;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

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
