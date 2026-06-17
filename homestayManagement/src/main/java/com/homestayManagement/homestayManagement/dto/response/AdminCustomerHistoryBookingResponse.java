package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminCustomerHistoryBookingResponse(
        Long bookingId,
        LocalDateTime bookingDate,
        String status,
        int roomCount,
        int totalAdults,
        int totalChildren,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal penaltyCharge,
        BigDecimal totalAmount,
        List<AdminCustomerHistoryRoomResponse> rooms
) {
}
