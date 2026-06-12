package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record DepositPolicyResponse(
        Long id,
        String policyName,
        String calculationType,
        BigDecimal policyValue,
        String description
) {
}
