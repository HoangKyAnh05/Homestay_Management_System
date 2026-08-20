package com.homestayManagement.homestayManagement.dto.email;

import java.math.BigDecimal;

public record CheckoutInvoiceEmailLine(
        String category,
        String name,
        String description,
        String unit,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
}
