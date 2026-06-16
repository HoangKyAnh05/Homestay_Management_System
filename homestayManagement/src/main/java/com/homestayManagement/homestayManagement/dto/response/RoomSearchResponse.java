package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RoomSearchResponse(
        Long roomId,
        String roomNumber,
        Long roomTypeId,
        String roomTypeName,
        Integer maxAdults,
        Integer maxChildren,
        String description,
        BigDecimal price,
        String rentType,
        Integer availableRooms,
        String primaryImageUrl,
        List<String> imageUrls,
        List<RoomPublicPriceResponse> prices
) {
}
