package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record AdminDirectBookingBusySlotResponse(
        Long bookingId,
        String bookingCode,
        Long bookingDetailId,
        String customerName,
        String customerPhone,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        String status
) {
}
