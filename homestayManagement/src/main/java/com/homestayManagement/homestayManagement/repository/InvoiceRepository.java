package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    @Query("""
            select distinct i from Invoice i
            join fetch i.booking b
            join fetch b.customer c
            left join fetch c.account
            join fetch i.employee e
            left join fetch e.account
            order by i.createdAt desc, i.id desc
            """)
    List<Invoice> findAllForAdmin();

    @Query("""
            select i from Invoice i
            join fetch i.booking b
            join fetch i.employee e
            where b.id = :bookingId
            """)
    Optional<Invoice> findByBookingIdForAdmin(@Param("bookingId") Long bookingId);
}
