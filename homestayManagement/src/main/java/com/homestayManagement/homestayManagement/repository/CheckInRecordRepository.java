package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.CheckInRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface CheckInRecordRepository extends JpaRepository<CheckInRecord, Long> {
    @Query("""
            select cr from CheckInRecord cr
            join fetch cr.bookingDetail bd
            where bd.booking.id = :bookingId
            order by cr.id
            """)
    List<CheckInRecord> findByBookingIdForInvoice(@Param("bookingId") Long bookingId);

    @Query("""
            select cr from CheckInRecord cr
            left join fetch cr.receptionist
            left join fetch cr.housekeeping
            where cr.bookingDetail.id = :bookingDetailId
            order by cr.id
            """)
    List<CheckInRecord> findByBookingDetailIdForAdmin(@Param("bookingDetailId") Long bookingDetailId);

    Optional<CheckInRecord> findByBookingDetailId(Long bookingDetailId);

    @Query("""
            select cr from CheckInRecord cr
            join cr.bookingDetail bd
            where bd.room.id = :roomId
            order by cr.id desc
            limit 1
            """)
    Optional<CheckInRecord> findLatestByRoomId(@Param("roomId") Long roomId);

    @Query("""
            select cr from CheckInRecord cr
            join fetch cr.bookingDetail bd
            left join fetch cr.receptionist
            left join fetch cr.housekeeping
            where bd.id in :bookingDetailIds
            """)
    List<CheckInRecord> findByBookingDetailIdsForAdmin(@Param("bookingDetailIds") Collection<Long> bookingDetailIds);

    @Query("""
            select cr from CheckInRecord cr
            join fetch cr.bookingDetail bd
            join fetch bd.booking b
            left join fetch bd.room r
            left join fetch bd.roomType rt
            where cr.actualCheckIn >= :startInclusive
              and cr.actualCheckIn < :endExclusive
            order by cr.actualCheckIn asc, b.bookingCode asc, r.roomNumber asc, cr.id asc
            """)
    List<CheckInRecord> findByActualCheckInRangeForTemporaryResidence(
            @Param("startInclusive") java.time.LocalDateTime startInclusive,
            @Param("endExclusive") java.time.LocalDateTime endExclusive
    );

    @Query("""
            select cr from CheckInRecord cr
            join fetch cr.bookingDetail bd
            join fetch bd.booking b
            left join fetch bd.room r
            left join fetch bd.roomType rt
            left join fetch cr.customer c
            where cr.actualCheckIn is not null
              and cr.actualCheckOut is null
            order by r.roomNumber asc, cr.actualCheckIn asc
            """)
    List<CheckInRecord> findCurrentlyOccupied();

    @Query("""
            select count(cr) from CheckInRecord cr
            where cr.actualCheckIn >= :startInclusive and cr.actualCheckIn < :endExclusive
            """)
    int countCheckInBetween(
            @Param("startInclusive") java.time.LocalDateTime startInclusive,
            @Param("endExclusive") java.time.LocalDateTime endExclusive
    );

    @Query("""
            select count(cr) from CheckInRecord cr
            where cr.actualCheckOut >= :startInclusive and cr.actualCheckOut < :endExclusive
            """)
    int countCheckOutBetween(
            @Param("startInclusive") java.time.LocalDateTime startInclusive,
            @Param("endExclusive") java.time.LocalDateTime endExclusive
    );
}
