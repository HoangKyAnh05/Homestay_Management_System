package com.homestayManagement.homestayManagement.dto.request;

import java.time.LocalDateTime;

public record PublicBookingExtensionCheckRequest(
        Long bookingDetailId,
        Integer additionalHours,
        Integer additionalDays,
        LocalDateTime targetCheckOut
) {}
