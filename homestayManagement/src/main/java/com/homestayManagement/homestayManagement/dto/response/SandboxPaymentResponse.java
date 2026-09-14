package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SandboxPaymentResponse(
        boolean success,
        String message,
        Long bookingId,
        String bookingCode,
        String paymentCode,
        String paymentStatus,
        BigDecimal amountPaid,
        LocalDateTime paymentTime
) {
}
