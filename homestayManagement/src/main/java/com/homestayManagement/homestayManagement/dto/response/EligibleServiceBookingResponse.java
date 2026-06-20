package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record EligibleServiceBookingResponse(
        Long bookingId,
        String status,
        String roomTypeName,
        Integer roomCount,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget
) {
}
