package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingInvoiceSummaryResponse(
        Long id,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal penaltyCharge,
        BigDecimal totalAmount,
        LocalDateTime createdAt,
        String employeeName
) {
}
