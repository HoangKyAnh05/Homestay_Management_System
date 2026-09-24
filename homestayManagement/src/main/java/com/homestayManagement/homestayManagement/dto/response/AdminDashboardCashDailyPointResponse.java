package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminDashboardCashDailyPointResponse(
        LocalDate date,
        BigDecimal cashAmount,
        BigDecimal transferAmount,
        BigDecimal totalAmount,
        int cashTransactionCount
) {
}
