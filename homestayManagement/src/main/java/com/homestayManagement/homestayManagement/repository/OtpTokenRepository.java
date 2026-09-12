package com.homestayManagement.homestayManagement.repository;

import lombok.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class OtpTokenRepository {
    private final Map<String, OtpToken> tokensByEmail = new ConcurrentHashMap<>();

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public Optional<OtpToken> findTopByEmailOrderByExpiresAtDesc(String email) {
        return Optional.ofNullable(tokensByEmail.get(normalize(email)));
    }

    public OtpToken save(OtpToken token) {
        if (token != null && token.getEmail() != null) {
            tokensByEmail.put(normalize(token.getEmail()), token);
        }
        return token;
    }

    public void deleteAllByEmail(String email) {
        tokensByEmail.remove(normalize(email));
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtpToken {
        private String email;
        private String otp;
        private LocalDateTime expiresAt;

        @Builder.Default
        private boolean used = false;

        @Builder.Default
        private boolean locked = false;

        @Builder.Default
        private int failedAttempts = 0;

        public int incrementFailedAttempts() {
            return ++this.failedAttempts;
        }

        public void resetFailedAttempts() {
            this.failedAttempts = 0;
            this.locked = false;
        }

        public void lock() {
            this.locked = true;
        }

        public boolean isLocked() {
            return this.locked || this.failedAttempts >= 5;
        }
    }
}
