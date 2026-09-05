package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.MarketingPostMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MarketingPostMetricRepository extends JpaRepository<MarketingPostMetric, Long> {
    @Query("select coalesce(sum(m.reach), 0) from MarketingPostMetric m")
    Long totalReach();

    @Query("select coalesce(avg(m.engagementRate), 0) from MarketingPostMetric m")
    Double averageEngagementRateSafe();

    Optional<MarketingPostMetric> findTopByChannelOrderByCollectedAtDesc(MarketingPostChannel channel);
}
