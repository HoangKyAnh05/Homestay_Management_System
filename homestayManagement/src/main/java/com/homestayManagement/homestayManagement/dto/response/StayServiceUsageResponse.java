package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record StayServiceUsageResponse(
        Long id,
        String source,
        String type,
        Long serviceId,
        String serviceName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount
) {
}
