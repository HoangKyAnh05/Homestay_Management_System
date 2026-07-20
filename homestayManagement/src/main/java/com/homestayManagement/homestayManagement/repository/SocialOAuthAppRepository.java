package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.SocialOAuthApp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialOAuthAppRepository extends JpaRepository<SocialOAuthApp, Long> {
    Optional<SocialOAuthApp> findByPlatform(String platform);

    Optional<SocialOAuthApp> findByPlatformAndActiveTrue(String platform);
}
