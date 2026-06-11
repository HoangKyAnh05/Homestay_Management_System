package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record FacilityServiceResponse(
        Long id,
        String name,
        BigDecimal price,
        Boolean isActive
) {
}
