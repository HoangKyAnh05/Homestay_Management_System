package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select b from Booking b
            join fetch b.customer c
            left join fetch c.account
            left join fetch b.depositPolicy
            where b.id = :id
            """)
    Optional<Booking> findByIdForPaymentUpdate(@Param("id") Long id);
}
