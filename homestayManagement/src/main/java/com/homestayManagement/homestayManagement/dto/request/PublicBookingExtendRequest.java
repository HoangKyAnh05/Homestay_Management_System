package com.homestayManagement.homestayManagement.dto.request;

import java.time.LocalDateTime;

public record PublicBookingExtendRequest(
        Long bookingDetailId,
        Integer additionalHours,
        LocalDateTime targetCheckOut,
        Long switchRoomId
) {}
