package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.ShiftHandover;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, Long> {

    Optional<ShiftHandover> findFirstByStatusOrderByHandoverTimeDesc(String status);

    Optional<ShiftHandover> findFirstByOrderByHandoverTimeDesc();

    Page<ShiftHandover> findAllByOrderByHandoverTimeDesc(Pageable pageable);

    @Query("SELECT s FROM ShiftHandover s WHERE " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:cashStatus IS NULL OR s.cashStatus = :cashStatus) AND " +
            "(:compensationStatus IS NULL OR s.compensationStatus = :compensationStatus) AND " +
            "(:fromDate IS NULL OR s.handoverTime >= :fromDate) AND " +
            "(:toDate IS NULL OR s.handoverTime <= :toDate) " +
            "ORDER BY s.handoverTime DESC")
    Page<ShiftHandover> searchHistory(
            @Param("status") String status,
            @Param("cashStatus") String cashStatus,
            @Param("compensationStatus") String compensationStatus,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    List<ShiftHandover> findByCompensationStatusOrderByHandoverTimeDesc(String compensationStatus);
}
