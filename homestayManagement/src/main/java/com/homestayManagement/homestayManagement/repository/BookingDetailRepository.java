package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
            join fetch bd.roomType
            left join fetch bd.room r
            where bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
            order by bd.checkInTarget asc, bd.id asc
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
            join fetch bd.roomType
            left join fetch bd.room r
            where bd.id = :id
            """)
    Optional<BookingDetail> findByIdForAdminDetail(@Param("id") Long id);

    List<BookingDetail> findByBookingId(Long bookingId);

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            join fetch bd.roomType
            left join fetch bd.room r
            where c.account.id = :accountId
              and b.status in ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
              and bd.status in ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
            order by b.bookingDate desc, b.id desc, bd.checkInTarget asc
            """)
    List<BookingDetail> findByCustomerAccountIdForAdminHistory(@Param("accountId") Long accountId);

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            left join fetch b.depositPolicy
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.roomType
            left join fetch bd.room r
            where c.account.email = :email
            order by b.bookingDate desc, b.id desc, bd.checkInTarget asc
            """)
    List<BookingDetail> findByCustomerEmailForHistory(@Param("email") String email);

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            left join fetch b.depositPolicy
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.roomType
            left join fetch bd.room r
            where c.account.email = :email
              and b.id = :bookingId
            order by bd.checkInTarget asc
            """)
    List<BookingDetail> findByCustomerEmailAndBookingIdForHistory(
            @Param("email") String email,
            @Param("bookingId") Long bookingId
    );

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch bd.roomType
            left join fetch bd.room r
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
            join fetch bd.roomType
            left join fetch bd.room r
            where bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
            order by bd.checkInTarget asc, bd.id asc
            """)
    List<BookingDetail> findDashboardDetails(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );

    @Query("""
            select bd
            from BookingDetail bd
            join fetch bd.booking b
            left join fetch bd.room r
            where ((:roomId is not null and r.id = :roomId) or (:roomTypeId is not null and bd.roomType.id = :roomTypeId))
              and bd.checkInTarget < :endExclusive
              and bd.checkOutTarget > :startInclusive
              and bd.status != 'CANCELLED'
              and b.status != 'CANCELLED'
            order by bd.checkInTarget asc
            """)
    List<BookingDetail> findPublicBusySlots(
            @Param("roomId") Long roomId,
            @Param("roomTypeId") Long roomTypeId,
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );

    default List<BookingDetail> findPublicBusySlotsByRoom(Long roomId, LocalDateTime startInclusive, LocalDateTime endExclusive) {
        return findPublicBusySlots(roomId, null, startInclusive, endExclusive);
    }

    @Modifying
    @Query("UPDATE BookingDetail bd SET bd.room = null WHERE bd.room.id = :roomId")
    void detachRoom(@Param("roomId") Long roomId);
}
