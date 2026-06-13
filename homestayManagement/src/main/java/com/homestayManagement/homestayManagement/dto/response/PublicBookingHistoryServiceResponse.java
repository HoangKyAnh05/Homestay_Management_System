package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record PublicBookingHistoryServiceResponse(
        Long id,
        Long bookingDetailId,
        String name,
        String type,
        Integer quantity,
        BigDecimal priceAtBooking,
        BigDecimal totalAmount
) {
}
