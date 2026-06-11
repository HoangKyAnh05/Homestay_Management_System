package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminPaymentResponse(
        Long id,
        String paymentMethod,
        String transactionNo,
        BigDecimal amount,
        String status,
        LocalDateTime paymentTime
) {
}
