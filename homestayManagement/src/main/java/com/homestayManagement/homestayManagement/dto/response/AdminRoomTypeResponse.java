package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminRoomTypeResponse(
        Long id,
        String name,
        BigDecimal basePrice,
        Integer maxAdults,
        Integer maxChildren,
        String description,
        int roomCount
) {
}
