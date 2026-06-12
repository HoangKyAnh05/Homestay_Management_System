package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDirectBookingRoomResponse(
        Long roomId,
        String roomNumber,
        String roomTypeName,
        BigDecimal basePrice,
        Integer maxAdults,
        Integer maxChildren,
        Long depositPolicyId,
        String depositPolicyName,
        boolean available,
        List<AdminDirectBookingBusySlotResponse> busySlots
) {
}
