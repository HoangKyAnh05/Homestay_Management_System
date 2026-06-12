package com.homestayManagement.homestayManagement.dto.response;

public record AdminRoomTypeResponse(
        Long id,
        String name,
        // basePrice đã bị loại bỏ — giá được quản lý trong room_price_configs
        Integer maxAdults,
        Integer maxChildren,
        Long depositPolicyId,
        String depositPolicyName,
        String description,
        int roomCount
) {
}
