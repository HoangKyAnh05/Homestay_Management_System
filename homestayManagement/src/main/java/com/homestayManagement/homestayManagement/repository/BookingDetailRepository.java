package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, Long> {

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.room r
            join fetch r.roomType
            where bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
            order by r.roomNumber asc, bd.checkInTarget asc
            """)
    List<BookingDetail> findOverlappingSchedule(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.room r
            join fetch r.roomType
            where bd.id = :id
            """)
    Optional<BookingDetail> findByIdForAdminDetail(@Param("id") Long id);

    List<BookingDetail> findByBookingId(Long bookingId);

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.room r
            join fetch r.roomType
            where bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
            order by b.bookingDate desc, b.id desc, bd.checkInTarget asc
            """)
    List<BookingDetail> findCheckInLogs(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.room r
            join fetch r.roomType
            where bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
            order by bd.checkInTarget asc, bd.id asc
            """)
    List<BookingDetail> findDashboardDetails(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );
}
