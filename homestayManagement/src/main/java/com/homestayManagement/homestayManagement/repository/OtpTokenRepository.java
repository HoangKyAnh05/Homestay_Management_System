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

    public Optional<OtpToken> findTopByEmailOrderByExpiresAtDesc(String email) {
        return Optional.ofNullable(tokensByEmail.get(email));
    }

    public OtpToken save(OtpToken token) {
        tokensByEmail.put(token.getEmail(), token);
        return token;
    }

    public void deleteAllByEmail(String email) {
        tokensByEmail.remove(email);
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
    }
}
