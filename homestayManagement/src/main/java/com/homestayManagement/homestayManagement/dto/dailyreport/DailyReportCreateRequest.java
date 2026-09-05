package com.homestayManagement.homestayManagement.dto.dailyreport;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyReportCreateRequest {

    @NotNull(message = "Ngày báo cáo không được để trống")
    private LocalDate reportDate;

    private String notes;

    private BigDecimal cashRevenue;
    private BigDecimal transferRevenue;
    private BigDecimal totalRevenue;

    private Integer occupiedRoomsCount;
    private Integer checkInTodayCount;
    private Integer checkOutTodayCount;

    private String snapshotDataJson;
}
