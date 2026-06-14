package com.homestayManagement.homestayManagement.dto.response;

public record AdminDirectBookingResponse(
        AdminBookingDetailResponse booking,
        boolean requiresPayment,
        SePayPaymentResponse payment
) {
}
