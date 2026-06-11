package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record RulesPenaltyResponse(
        Long id,
        String title,
        BigDecimal penaltyAmount
) {
}
