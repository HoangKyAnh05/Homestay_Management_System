package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminDashboardRevenuePointResponse(
        LocalDate date,
        BigDecimal roomRevenue,
        BigDecimal serviceRevenue,
        BigDecimal penaltyRevenue,
        BigDecimal totalRevenue
) {
}
