package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminCustomerHistoryServiceResponse(
        Long id,
        String name,
        String type,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount
) {
}
