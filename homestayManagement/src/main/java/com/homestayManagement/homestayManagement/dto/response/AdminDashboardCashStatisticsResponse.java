package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardCashStatisticsResponse(
        BigDecimal cashToday,
        BigDecimal cashThisWeek,
        BigDecimal cashThisMonth,
        BigDecimal cashInFilterRange,
        BigDecimal transferInFilterRange,
        BigDecimal totalInFilterRange,
        List<AdminDashboardCashDailyPointResponse> dailyCashTrend,
        List<AdminDashboardCashTransactionResponse> recentCashTransactions
) {
}
