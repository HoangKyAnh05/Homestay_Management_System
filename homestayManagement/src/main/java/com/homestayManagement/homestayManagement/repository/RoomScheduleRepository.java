package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.RoomSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomScheduleRepository extends JpaRepository<RoomSchedule, Long> {
    @Query("""
            select rs from RoomSchedule rs
            join fetch rs.room r
            where rs.startTime < :endExclusive
              and rs.endTime > :startInclusive
            order by rs.startTime asc
            """)
    List<RoomSchedule> findOverlapping(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );
}
