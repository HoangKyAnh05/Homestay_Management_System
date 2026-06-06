package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RoomTypeResponse(
        Long id,
        String name,
        BigDecimal basePrice,
        Integer maxAdults,
        Integer maxChildren,
        String description,
        String primaryImageUrl,
        List<String> imageUrls
) {
}
