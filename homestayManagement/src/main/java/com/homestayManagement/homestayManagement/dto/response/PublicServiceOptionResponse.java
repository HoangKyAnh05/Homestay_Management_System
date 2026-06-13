package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record PublicServiceOptionResponse(
        Long id,
        String name,
        BigDecimal price,
        String type,
        Integer quantityInStock
) {
}
