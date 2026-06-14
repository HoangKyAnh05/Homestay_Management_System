package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    @Query("""
            select distinct i from Invoice i
            join fetch i.booking b
            join fetch b.customer c
            left join fetch c.account
            left join fetch i.employee e
            left join fetch e.account
            order by i.createdAt desc, i.id desc
            """)
    List<Invoice> findAllForAdmin();

    @Query("""
            select i from Invoice i
            join fetch i.booking b
            left join fetch i.employee e
            where b.id = :bookingId
            """)
    Optional<Invoice> findByBookingIdForAdmin(@Param("bookingId") Long bookingId);

    @Query("""
            select distinct i from Invoice i
            join fetch i.booking b
            join fetch b.customer c
            left join fetch c.account
            left join fetch i.employee e
            where i.createdAt >= :startInclusive
              and i.createdAt < :endExclusive
            order by i.createdAt asc, i.id asc
            """)
    List<Invoice> findByCreatedAtRangeForDashboard(
            @Param("startInclusive") LocalDateTime startInclusive,
            @Param("endExclusive") LocalDateTime endExclusive
    );
}
