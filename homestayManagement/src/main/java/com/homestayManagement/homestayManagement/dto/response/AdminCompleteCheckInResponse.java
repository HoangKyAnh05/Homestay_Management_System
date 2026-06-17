package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record AdminCompleteCheckInResponse(
        Long bookingId,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String status,
        LocalDateTime actualCheckIn,
        int guestCount
) {
}
