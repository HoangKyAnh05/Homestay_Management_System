package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicBookingHistoryRoomResponse(
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Integer numberOfAdults,
        Integer numberOfChildren,
        BigDecimal priceAtBooking,
        String rentType,
        String status
) {
}
