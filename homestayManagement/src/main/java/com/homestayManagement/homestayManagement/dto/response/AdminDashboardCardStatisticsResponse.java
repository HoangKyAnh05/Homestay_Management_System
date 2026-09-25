package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardCardStatisticsResponse(
        BigDecimal cardToday,
        BigDecimal cardThisWeek,
        BigDecimal cardThisMonth,
        BigDecimal cardInFilterRange,
        BigDecimal pureCardInFilterRange,
        BigDecimal combinedInFilterRange,
        List<AdminDashboardCardDailyPointResponse> dailyCardTrend,
        List<AdminDashboardCardTransactionResponse> recentCardTransactions
) {
}
