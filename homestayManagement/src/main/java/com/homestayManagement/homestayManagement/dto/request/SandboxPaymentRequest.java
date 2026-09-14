package com.homestayManagement.homestayManagement.dto.request;

import java.math.BigDecimal;

public record SandboxPaymentRequest(
        Long bookingId,
        String paymentCode,
        BigDecimal amount,
        String simulationType
) {
}
