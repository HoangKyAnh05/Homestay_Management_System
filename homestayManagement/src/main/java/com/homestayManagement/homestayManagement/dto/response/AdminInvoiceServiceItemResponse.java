package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminInvoiceServiceItemResponse(
        Long id,
        String type,
        String name,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
}
