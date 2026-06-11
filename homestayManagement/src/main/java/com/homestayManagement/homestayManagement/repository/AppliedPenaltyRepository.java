package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppliedPenaltyRepository extends JpaRepository<AppliedPenalty, Long> {
    boolean existsByRulesPenaltyId(Long rulesPenaltyId);
}
