package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MarketingPostChannelRepository extends JpaRepository<MarketingPostChannel, Long> {
    List<MarketingPostChannel> findByPostIdOrderByIdAsc(Long postId);
    long countByStatus(String status);
    List<MarketingPostChannel> findTop20ByStatusAndScheduledAtLessThanEqualAndPostedAtIsNullOrderByScheduledAtAsc(String status, LocalDateTime scheduledAt);
}
