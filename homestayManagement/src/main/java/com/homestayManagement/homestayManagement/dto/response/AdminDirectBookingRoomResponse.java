package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDirectBookingRoomResponse(
        Long roomId,
        String roomNumber,
        String roomTypeName,
        Long roomTypeId,
        Integer maxAdults,
        Integer maxChildren,
        Long depositPolicyId,
        String depositPolicyName,
        /** Loại cách tính cọc: PERCENTAGE hoặc FIXED_AMOUNT */
        String depositCalculationType,
        /** Giá trị cọc (% hoặc số tiền cố định) */
        BigDecimal depositPolicyValue,
        boolean available,
        List<AdminDirectBookingBusySlotResponse> busySlots
) {
}
