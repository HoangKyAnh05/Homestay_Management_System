package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.StayAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StayAccessRepository extends JpaRepository<StayAccess, Long> {

    Optional<StayAccess> findByBookingDetailId(Long bookingDetailId);

    @Query("""
            select sa from StayAccess sa
            join fetch sa.account a
            join fetch sa.bookingDetail bd
            join fetch bd.booking b
            join fetch bd.roomType rt
            left join fetch bd.room r
            join fetch sa.checkInRecord cr
            where lower(a.email) = lower(:email)
              and sa.status = 'ACTIVE'
              and cr.actualCheckOut is null
              and bd.status = 'CHECKED_IN'
            order by cr.actualCheckIn desc, sa.id desc
            """)
    List<StayAccess> findCurrentByAccountEmail(@Param("email") String email);

    @Query("""
            select sa from StayAccess sa
            join fetch sa.account a
            join fetch sa.bookingDetail bd
            join fetch bd.booking b
            join fetch bd.roomType rt
            left join fetch bd.room r
            join fetch sa.checkInRecord cr
            where sa.id = :id
              and lower(a.email) = lower(:email)
            """)
    Optional<StayAccess> findByIdAndAccountEmail(@Param("id") Long id, @Param("email") String email);

    List<StayAccess> findByAccountIdAndStatus(Long accountId, String status);
}
