package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record PublicAmenityResponse(
        Long id,
        String name,
        BigDecimal price
) {
}
