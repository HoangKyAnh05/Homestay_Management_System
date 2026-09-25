package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminDashboardCardDailyPointResponse(
        LocalDate date,
        BigDecimal cardAmount,
        BigDecimal pureCardAmount,
        BigDecimal combinedAmount,
        int cardTransactionCount
) {
}
