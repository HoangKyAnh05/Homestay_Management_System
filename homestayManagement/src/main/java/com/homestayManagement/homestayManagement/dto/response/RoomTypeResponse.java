package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record RoomTypeResponse(
        Long id,
        String name,
        // basePrice đã bị loại bỏ — giá được quản lý trong room_price_configs
        Integer maxAdults,
        Integer maxChildren,
        String description,
        String primaryImageUrl,
        List<String> imageUrls
) {
}
