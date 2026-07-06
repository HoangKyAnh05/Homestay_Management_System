package com.homestayManagement.homestayManagement.dto.response;

public record StayServiceOrderResponse(
        Long accessId,
        String roomNumber,
        StayServiceUsageResponse service
) {
}
