package com.homestayManagement.homestayManagement.dto.email;

import java.math.BigDecimal;

public record CheckoutInvoiceEmailLine(
        String category,
        String name,
        String description,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
}
