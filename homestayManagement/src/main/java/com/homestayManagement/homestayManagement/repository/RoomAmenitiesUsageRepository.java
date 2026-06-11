package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomAmenitiesUsageRepository extends JpaRepository<RoomAmenitiesUsage, Long> {
    boolean existsByItemId(Long itemId);
}
