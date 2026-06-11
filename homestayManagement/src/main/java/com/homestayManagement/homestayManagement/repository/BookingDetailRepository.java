package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

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
}
