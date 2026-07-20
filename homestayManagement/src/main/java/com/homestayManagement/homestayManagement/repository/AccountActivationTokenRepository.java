package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.AccountActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountActivationTokenRepository extends JpaRepository<AccountActivationToken, Long> {
    Optional<AccountActivationToken> findByTokenHash(String tokenHash);
}
