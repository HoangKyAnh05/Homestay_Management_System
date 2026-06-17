package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminCustomerBookingHistoryResponse(
        Long accountId,
        Long customerId,
        String customerName,
        int bookingCount,
        List<AdminCustomerHistoryBookingResponse> bookings
) {
}
