package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingCheckInResponse(
        Long id,
        LocalDateTime actualCheckIn,
        LocalDateTime actualCheckOut,
        BigDecimal earlyCheckInFee,
        BigDecimal lateCheckOutFee,
        String receptionistName,
        String housekeepingName
) {
}
