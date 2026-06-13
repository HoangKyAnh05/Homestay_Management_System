package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PublicBookingResponse(
        Long bookingId,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String status,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        List<PublicBookingRoomResponse> rooms,
        boolean requiresDeposit,
        String depositPolicyName,
        String depositCalculationType,
        BigDecimal depositPolicyValue,
        BigDecimal depositAmount
) {
}
