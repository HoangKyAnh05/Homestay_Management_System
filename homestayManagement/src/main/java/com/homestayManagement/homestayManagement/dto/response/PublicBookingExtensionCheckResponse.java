package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PublicBookingExtensionCheckResponse(
        boolean available,
        boolean currentRoomAvailable,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        LocalDateTime currentCheckOut,
        LocalDateTime newCheckOut,
        int additionalHours,
        BigDecimal extensionFee,
        String message,
        List<AlternativeRoomOptionResponse> alternativeRooms
) {}
