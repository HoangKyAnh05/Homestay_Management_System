package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record HousekeepingPenaltyItemResponse(
        Long ruleId,
        String title,
        BigDecimal amount,
        boolean selected
) {
}
