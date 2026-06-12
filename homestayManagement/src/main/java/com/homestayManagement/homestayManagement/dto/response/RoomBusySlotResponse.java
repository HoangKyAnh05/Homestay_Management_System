package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record RoomBusySlotResponse(
        Long bookingDetailId,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        String status
) {
}
