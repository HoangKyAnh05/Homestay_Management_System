package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FixedFundConfigResponse(
        Long id,
        BigDecimal fundAmount,
        String fundMode,
        String description,
        String updatedByName,
        LocalDateTime updatedAt,
        List<FundAdjustmentLogResponse> adjustmentLogs
) {
}
