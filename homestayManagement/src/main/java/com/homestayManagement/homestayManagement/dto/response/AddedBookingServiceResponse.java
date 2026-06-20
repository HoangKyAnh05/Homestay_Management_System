package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AddedBookingServiceResponse(
        Long bookingId,
        Long serviceItemId,
        String serviceName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal addedAmount,
        BigDecimal serviceCharge,
        BigDecimal bookingTotal
) {
}
