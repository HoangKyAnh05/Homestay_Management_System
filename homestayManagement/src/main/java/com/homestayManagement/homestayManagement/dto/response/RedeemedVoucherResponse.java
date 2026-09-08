package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RedeemedVoucherResponse(
        Long id,
        String code,
        String name,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minOrderValue,
        BigDecimal maxDiscountAmount,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Integer usageLimit,
        Integer usedCount,
        Integer pointsUsed,
        Integer remainingPoints
) {
}
