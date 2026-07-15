package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.SocialOAuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialOAuthSessionRepository extends JpaRepository<SocialOAuthSession, Long> {
    Optional<SocialOAuthSession> findBySessionId(String sessionId);

    Optional<SocialOAuthSession> findByStateToken(String stateToken);
}
