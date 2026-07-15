package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    List<SocialAccount> findByActiveTrueOrderByPlatformAscAccountNameAsc();

    Optional<SocialAccount> findFirstByPlatformAndExternalAccountId(String platform, String externalAccountId);

    Optional<SocialAccount> findFirstByPlatformAndExternalAccountIdAndActiveTrue(String platform, String externalAccountId);

    Optional<SocialAccount> findFirstByPlatformAndAccountNameIgnoreCaseAndActiveTrue(String platform, String accountName);

    Optional<SocialAccount> findFirstByPlatformAndPageUrlAndActiveTrue(String platform, String pageUrl);

    Optional<SocialAccount> findFirstByPlatformAndActiveTrueOrderByIdAsc(String platform);
}
