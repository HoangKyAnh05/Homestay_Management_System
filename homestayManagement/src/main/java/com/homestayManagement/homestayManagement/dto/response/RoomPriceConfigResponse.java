package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record RoomPriceConfigResponse(
        Long id,
        Long roomTypeId,
        String roomTypeName,
        Long pricePolicyId,
        String policyName,
        String rentType,
        String dayType,
        BigDecimal price
) {
}
