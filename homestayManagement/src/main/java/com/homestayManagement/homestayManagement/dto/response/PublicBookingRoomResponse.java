package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record PublicBookingRoomResponse(
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        Integer numberOfAdults,
        Integer numberOfChildren,
        BigDecimal priceAtBooking,
        String rentType
) {
}
