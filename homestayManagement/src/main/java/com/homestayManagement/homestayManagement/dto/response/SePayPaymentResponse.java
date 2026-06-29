package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SePayPaymentResponse(
        Long bookingId,
        Long paymentId,
        BigDecimal amount,
        String paymentCode,
        String transferContent,
        String bankName,
        String accountNumber,
        String accountHolder,
        String qrCodeUrl,
        LocalDateTime holdExpiresAt
) {
}
