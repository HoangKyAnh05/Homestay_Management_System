package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPublishAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketingPublishAttemptRepository extends JpaRepository<MarketingPublishAttempt, Long> {
    long countByChannelId(Long channelId);
}
