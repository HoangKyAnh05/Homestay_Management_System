package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomAmenitiesUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomAmenitiesUsageRepository extends JpaRepository<RoomAmenitiesUsage, Long> {
    boolean existsByItemId(Long itemId);

    @Query("""
            select u from RoomAmenitiesUsage u
            join fetch u.checkInRecord cr
            join cr.bookingDetail bd
            join fetch u.item
            where bd.booking.id = :bookingId
            order by u.id
            """)
    List<RoomAmenitiesUsage> findByBookingIdForInvoice(@Param("bookingId") Long bookingId);

    @Query("""
            select u from RoomAmenitiesUsage u
            join fetch u.checkInRecord cr
            join fetch u.item
            where cr.bookingDetail.id = :bookingDetailId
            order by u.id
            """)
    List<RoomAmenitiesUsage> findByBookingDetailIdForAdmin(@Param("bookingDetailId") Long bookingDetailId);
}
