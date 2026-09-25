package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AddedBookingServiceResponse(
        Long bookingId,
        String bookingCode,
        Long serviceItemId,
        String serviceName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal addedAmount,
        BigDecimal serviceCharge,
        BigDecimal bookingTotal,
        SePayPaymentResponse payment
) {
    public AddedBookingServiceResponse(
            Long bookingId,
            String bookingCode,
            Long serviceItemId,
            String serviceName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal addedAmount,
            BigDecimal serviceCharge,
            BigDecimal bookingTotal
    ) {
        this(bookingId, bookingCode, serviceItemId, serviceName, quantity, unitPrice, addedAmount, serviceCharge, bookingTotal, null);
    }
}
