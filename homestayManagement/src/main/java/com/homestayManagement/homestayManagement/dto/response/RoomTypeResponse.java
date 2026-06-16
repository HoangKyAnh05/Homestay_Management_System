package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RoomTypeResponse(
        Long id,
        Long representativeRoomId,
        String name,
        // basePrice đã bị loại bỏ — giá được quản lý trong room_price_configs
        Integer maxAdults,
        Integer maxChildren,
        String description,
        BigDecimal weekdayPrice,
        BigDecimal weekendPrice,
        String rentType,
        Integer availableRooms,
        String primaryImageUrl,
        List<String> imageUrls,
        List<RoomPublicPriceResponse> prices
) {
}
