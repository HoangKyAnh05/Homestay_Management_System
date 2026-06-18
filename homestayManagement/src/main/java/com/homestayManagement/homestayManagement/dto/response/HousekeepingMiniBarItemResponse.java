package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record HousekeepingMiniBarItemResponse(
        Long itemId,
        String name,
        BigDecimal unitPrice,
        Integer quantityInStock,
        Integer quantityUsed,
        BigDecimal totalPrice
) {
}
