package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record AdminDirectBookingBusySlotResponse(
        Long bookingId,
        Long bookingDetailId,
        String customerName,
        String customerPhone,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        String status
) {
}
