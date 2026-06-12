package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminDirectBookingRoomResponse(
        Long roomId,
        String roomNumber,
        String roomTypeName,
        // basePrice đã bị loại bỏ — giá được quản lý trong room_price_configs
        Integer maxAdults,
        Integer maxChildren,
        Long depositPolicyId,
        String depositPolicyName,
        boolean available,
        List<AdminDirectBookingBusySlotResponse> busySlots
) {
}
