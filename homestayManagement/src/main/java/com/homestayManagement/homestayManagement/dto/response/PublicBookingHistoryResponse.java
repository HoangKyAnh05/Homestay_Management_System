package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicBookingHistoryResponse(
        Long bookingId,
        LocalDateTime bookingDate,
        String status,
        String firstRoomNumber,
        String firstRoomTypeName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Integer roomCount,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        boolean requiresPayment,
        String depositPolicyName,
        String depositCalculationType,
        BigDecimal depositPolicyValue,
        BigDecimal depositAmount
) {
}
