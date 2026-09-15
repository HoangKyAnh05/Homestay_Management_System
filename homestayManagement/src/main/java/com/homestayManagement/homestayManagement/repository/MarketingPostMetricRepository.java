package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingPostChannel;
import com.homestayManagement.homestayManagement.entity.MarketingPostMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MarketingPostMetricRepository extends JpaRepository<MarketingPostMetric, Long> {
    @Query("select coalesce(sum(m.reach), 0) from MarketingPostMetric m where m.id in (select max(m2.id) from MarketingPostMetric m2 group by m2.channel)")
    Long totalReach();

    @Query("select coalesce(avg(m.engagementRate), 0) from MarketingPostMetric m where m.id in (select max(m2.id) from MarketingPostMetric m2 group by m2.channel)")
    Double averageEngagementRateSafe();

    Optional<MarketingPostMetric> findTopByChannelOrderByCollectedAtDesc(MarketingPostChannel channel);
}
