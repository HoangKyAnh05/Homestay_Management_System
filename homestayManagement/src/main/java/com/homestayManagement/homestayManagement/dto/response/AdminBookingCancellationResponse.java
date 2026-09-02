package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingCancellationResponse(
        Long bookingId,
        String bookingCode,
        Long customerId,
        String customerName,
        String customerPhone,
        String customerEmail,
        String zaloPhone,
        LocalDateTime bookingDate,
        LocalDateTime checkInTarget,
        LocalDateTime cancelledAt,
        String cancellationReason,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        Integer refundRate,
        BigDecimal refundAmount,
        String refundStatus,
        String refundInfo,
        LocalDateTime refundCompletedAt,
        String refundHandledBy
) {
}
