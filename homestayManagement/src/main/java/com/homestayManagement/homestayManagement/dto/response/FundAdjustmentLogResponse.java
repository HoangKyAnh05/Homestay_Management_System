package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FundAdjustmentLogResponse(
        Long id,
        BigDecimal oldAmount,
        BigDecimal newAmount,
        String oldMode,
        String newMode,
        String reason,
        String adjustedByName,
        LocalDateTime adjustedAt
) {
}
