package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.PricePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricePolicyRepository extends JpaRepository<PricePolicy, Long> {
    boolean existsByPolicyName(String policyName);
}
