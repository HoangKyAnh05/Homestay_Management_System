package com.homestayManagement.homestayManagement.dto.request;

import java.time.LocalDateTime;

public record PublicBookingExtensionCheckRequest(
        Long bookingDetailId,
        Integer additionalHours,
        LocalDateTime targetCheckOut
) {}
