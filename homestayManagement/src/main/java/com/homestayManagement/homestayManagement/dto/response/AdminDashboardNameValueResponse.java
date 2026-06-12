package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminDashboardNameValueResponse(
        String name,
        BigDecimal value,
        Long count
) {
}
