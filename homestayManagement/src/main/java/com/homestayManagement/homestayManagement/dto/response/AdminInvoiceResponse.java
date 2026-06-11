package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminInvoiceResponse(
        Long id,
        Long bookingId,
        String bookingStatus,
        Long customerId,
        String customerName,
        String customerEmail,
        Long employeeId,
        String employeeName,
        BigDecimal roomCharge,
        BigDecimal penaltyCharge,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        String latestPaymentMethod,
        String latestPaymentStatus,
        LocalDateTime latestPaymentTime,
        LocalDateTime createdAt,
        List<AdminPaymentResponse> payments
) {
}
