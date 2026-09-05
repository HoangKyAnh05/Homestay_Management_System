package com.homestayManagement.homestayManagement.dto.dailyreport;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReportResponse {
    private Long id;
    private LocalDate reportDate;
    private String staffUsername;
    private String staffFullName;
    private LocalDateTime createdAt;
    private BigDecimal totalRevenue;
    private BigDecimal cashRevenue;
    private BigDecimal transferRevenue;
    private Integer occupiedRoomsCount;
    private Integer checkInTodayCount;
    private Integer checkOutTodayCount;
    private String notes;
    private String status;
    private String acknowledgedBy;
    private LocalDateTime acknowledgedAt;
    private String snapshotDataJson;
}
