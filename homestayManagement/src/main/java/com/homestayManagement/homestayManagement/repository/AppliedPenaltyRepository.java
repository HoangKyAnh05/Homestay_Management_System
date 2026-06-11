package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AppliedPenaltyRepository extends JpaRepository<AppliedPenalty, Long> {
    boolean existsByRulesPenaltyId(Long rulesPenaltyId);

    @Query("""
            select p from AppliedPenalty p
            join fetch p.checkRecord cr
            join cr.bookingDetail bd
            join fetch p.rulesPenalty
            where bd.booking.id = :bookingId
            order by p.id
            """)
    List<AppliedPenalty> findByBookingIdForInvoice(@Param("bookingId") Long bookingId);

    @Query("""
            select p from AppliedPenalty p
            join fetch p.checkRecord cr
            join fetch p.rulesPenalty
            where cr.bookingDetail.id = :bookingDetailId
            order by p.id
            """)
    List<AppliedPenalty> findByBookingDetailIdForAdmin(@Param("bookingDetailId") Long bookingDetailId);
}
