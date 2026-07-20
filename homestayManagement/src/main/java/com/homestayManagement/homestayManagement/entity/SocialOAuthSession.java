package com.homestayManagement.homestayManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "social_oauth_sessions", indexes = {
        @Index(name = "idx_social_oauth_sessions_session", columnList = "session_id"),
        @Index(name = "idx_social_oauth_sessions_state", columnList = "state_token")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialOAuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 80, unique = true)
    private String sessionId;

    @Column(name = "state_token", nullable = false, length = 120, unique = true)
    private String stateToken;

    @Column(nullable = false, length = 30)
    private String platform;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "auth_url", columnDefinition = "TEXT")
    private String authUrl;

    @Column(name = "connected_account_id")
    private Long connectedAccountId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

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
