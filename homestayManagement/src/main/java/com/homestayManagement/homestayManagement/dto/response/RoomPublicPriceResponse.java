package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record RoomPublicPriceResponse(
        String policyName,
        String rentType,
        String dayType,
        BigDecimal price
) {
}
