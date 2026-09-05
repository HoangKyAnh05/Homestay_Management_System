package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.DailyClosingReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyClosingReportRepository extends JpaRepository<DailyClosingReport, Long> {

    Optional<DailyClosingReport> findFirstByReportDateOrderByCreatedAtDesc(LocalDate reportDate);

    Page<DailyClosingReport> findByReportDateBetweenOrderByReportDateDescCreatedAtDesc(
            LocalDate fromDate, LocalDate toDate, Pageable pageable);

    Page<DailyClosingReport> findAllByOrderByReportDateDescCreatedAtDesc(Pageable pageable);

    long countByStatus(String status);
}
