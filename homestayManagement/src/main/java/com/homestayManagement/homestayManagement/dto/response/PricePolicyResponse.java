package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalTime;

public record PricePolicyResponse(
        Long id,
        String policyName,
        String rentType,
        LocalTime standardCheckIn,
        LocalTime standardCheckOut,
        Integer limitHours
) {
}
