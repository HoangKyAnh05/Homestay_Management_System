package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.HousekeepingTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HousekeepingTaskRepository extends JpaRepository<HousekeepingTask, Long> {

    Optional<HousekeepingTask> findByCheckInRecordId(Long checkInRecordId);

    List<HousekeepingTask> findByCheckInRecordIdIn(List<Long> checkInRecordIds);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"room", "assignedHousekeeping"})
    Optional<HousekeepingTask> findFirstByRoomIdAndCleaningCompletedAtIsNotNullAndCleaningCompletedAtLessThanEqualOrderByCleaningCompletedAtDesc(
            Long roomId,
            java.time.LocalDateTime completedBefore
    );

    @Query("""
            select ht from HousekeepingTask ht
            join fetch ht.checkInRecord cr
            join fetch cr.bookingDetail bd
            join fetch bd.booking b
            join fetch b.customer
            join fetch ht.room r
            left join fetch ht.requestedBy
            left join fetch ht.assignedHousekeeping
            where ht.id = :id
            """)
    Optional<HousekeepingTask> findByIdForDetail(@Param("id") Long id);

    @Query("""
            select ht from HousekeepingTask ht
            join fetch ht.checkInRecord cr
            join fetch cr.bookingDetail bd
            join fetch bd.booking b
            join fetch b.customer
            join fetch ht.room r
            left join fetch ht.requestedBy
            left join fetch ht.assignedHousekeeping
            order by
              case when ht.cleaningStatus = 'COMPLETED' then 1 else 0 end,
              ht.requestedAt asc
            """)
    List<HousekeepingTask> findAllForHousekeeping();

    @Query("""
            select ht from HousekeepingTask ht
            join fetch ht.checkInRecord cr
            join fetch cr.bookingDetail bd
            join fetch bd.booking b
            join fetch b.customer
            join fetch ht.room r
            left join fetch ht.requestedBy
            left join fetch ht.assignedHousekeeping
            where bd.id = :bookingDetailId
            """)
    Optional<HousekeepingTask> findByBookingDetailIdForDetail(@Param("bookingDetailId") Long bookingDetailId);
}
