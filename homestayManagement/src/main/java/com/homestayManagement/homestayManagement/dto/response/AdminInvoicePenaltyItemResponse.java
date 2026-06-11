package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminInvoicePenaltyItemResponse(
        Long id,
        String title,
        BigDecimal amount,
        String description
) {
}
