package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.FundAdjustmentLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FundAdjustmentLogRepository extends JpaRepository<FundAdjustmentLog, Long> {
    List<FundAdjustmentLog> findTop50ByOrderByAdjustedAtDesc();
}
