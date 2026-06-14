package com.homestayManagement.homestayManagement.dto.response;

public record AdminCheckoutResponse(
        boolean completed,
        AdminBookingDetailResponse booking,
        SePayPaymentResponse payment
) {
}
