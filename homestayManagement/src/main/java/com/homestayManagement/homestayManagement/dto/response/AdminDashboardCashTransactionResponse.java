package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminDashboardCashTransactionResponse(
        Long paymentId,
        String bookingCode,
        String customerName,
        String paymentPurpose,
        LocalDateTime paymentTime,
        BigDecimal amount,
        String status
) {
}
