package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminDashboardCardTransactionResponse(
        Long paymentId,
        String bookingCode,
        String customerName,
        String paymentPurpose,
        String paymentMethod,
        boolean isCombined,
        LocalDateTime paymentTime,
        BigDecimal amount,
        String status
) {
}
