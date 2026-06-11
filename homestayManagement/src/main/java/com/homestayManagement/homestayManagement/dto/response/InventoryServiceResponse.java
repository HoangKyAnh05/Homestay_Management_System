package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record InventoryServiceResponse(
        Long id,
        String name,
        BigDecimal price,
        Integer quantityInStock
) {
}
