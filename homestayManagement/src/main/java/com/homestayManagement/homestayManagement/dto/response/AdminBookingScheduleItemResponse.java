package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingScheduleItemResponse(
        Long bookingId,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        Long customerId,
        String customerName,
        String customerPhone,
        LocalDateTime bookingDate,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Integer numberOfAdults,
        Integer numberOfChildren,
        BigDecimal priceAtBooking,
        String rentType,
        String bookingStatus,
        String detailStatus
) {
}
