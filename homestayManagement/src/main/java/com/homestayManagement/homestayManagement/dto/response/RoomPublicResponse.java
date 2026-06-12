package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RoomPublicResponse(
        Long roomId,
        String roomNumber,
        Long roomTypeId,
        String roomTypeName,
        Integer maxAdults,
        Integer maxChildren,
        String description,
        BigDecimal weekdayPrice,
        BigDecimal weekendPrice,
        String rentType,
        String primaryImageUrl,
        List<String> imageUrls
) {
}
