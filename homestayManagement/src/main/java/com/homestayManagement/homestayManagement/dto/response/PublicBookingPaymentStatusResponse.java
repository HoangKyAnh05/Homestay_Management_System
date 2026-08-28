package com.homestayManagement.homestayManagement.dto.response;

public record PublicBookingPaymentStatusResponse(
        Long bookingId,
        String bookingCode,
        String status
) {
}
