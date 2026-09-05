package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.GiveawayLead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GiveawayLeadRepository extends JpaRepository<GiveawayLead, Long> {

    Optional<GiveawayLead> findBySpinToken(String spinToken);

    boolean existsByPhoneAndCreatedAtAfter(String phone, LocalDateTime after);

    @Query("SELECT g FROM GiveawayLead g WHERE " +
            "(:search IS NULL OR LOWER(g.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR g.phone LIKE CONCAT('%', :search, '%')) " +
            "AND (:status IS NULL OR g.status = :status) " +
            "ORDER BY g.createdAt DESC")
    Page<GiveawayLead> searchLeads(@Param("search") String search, @Param("status") String status, Pageable pageable);

    long countByStatus(String status);

    long countByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT COUNT(g) FROM GiveawayLead g WHERE g.discountPercent >= 50")
    long countTopPrizesWon();

    List<GiveawayLead> findAllByOrderByCreatedAtDesc();
}
