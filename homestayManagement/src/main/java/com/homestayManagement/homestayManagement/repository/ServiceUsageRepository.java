package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceUsageRepository extends JpaRepository<ServiceUsage, Long> {
    boolean existsByFacilityServiceId(Long facilityServiceId);
    boolean existsByInventoryServiceId(Long inventoryServiceId);
}
