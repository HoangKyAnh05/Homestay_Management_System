package com.homestayManagement.homestayManagement.dto.request;

import java.time.LocalDateTime;

public record PublicBookingExtendRequest(
        Long bookingDetailId,
        Integer additionalHours,
        Integer additionalDays,
        LocalDateTime targetCheckOut,
        Long switchRoomId
) {}
