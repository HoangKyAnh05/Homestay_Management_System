package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.AppliedPenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AppliedPenaltyRepository extends JpaRepository<AppliedPenalty, Long> {
    boolean existsByRulesPenaltyId(Long rulesPenaltyId);

    void deleteByCheckRecordId(Long checkRecordId);

    @Modifying
    @Query("delete from AppliedPenalty p where p.checkRecord.id = :checkRecordId and (p.description is null or p.description not like 'Bồi thường%')")
    void deleteStandardRulePenaltiesByCheckRecordId(@Param("checkRecordId") Long checkRecordId);

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
