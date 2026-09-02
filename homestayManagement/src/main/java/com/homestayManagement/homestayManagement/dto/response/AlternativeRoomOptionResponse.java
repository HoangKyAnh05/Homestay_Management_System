package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AlternativeRoomOptionResponse(
        Long roomId,
        String roomNumber,
        Long roomTypeId,
        String roomTypeName,
        BigDecimal pricePerHour,
        BigDecimal totalPrice,
        Integer capacityAdults,
        Integer capacityChildren,
        String imageUrl
) {}
