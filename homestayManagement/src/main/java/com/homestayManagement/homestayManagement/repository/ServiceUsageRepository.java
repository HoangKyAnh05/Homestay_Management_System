package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.ServiceUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ServiceUsageRepository extends JpaRepository<ServiceUsage, Long> {
    boolean existsByFacilityServiceId(Long facilityServiceId);
    boolean existsByInventoryServiceId(Long inventoryServiceId);

    @Query("""
            select s from ServiceUsage s
            join fetch s.checkInRecord cr
            join cr.bookingDetail bd
            left join fetch s.facilityService
            left join fetch s.inventoryService
            where bd.booking.id = :bookingId
            order by s.id
            """)
    List<ServiceUsage> findByBookingIdForInvoice(@Param("bookingId") Long bookingId);
}
