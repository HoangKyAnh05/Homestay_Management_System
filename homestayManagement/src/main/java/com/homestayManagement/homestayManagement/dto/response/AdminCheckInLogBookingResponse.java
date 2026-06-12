package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminCheckInLogBookingResponse(
        Long bookingId,
        LocalDateTime bookingDate,
        String bookingStatus,
        AdminBookingCustomerResponse customer,
        Integer totalDetails,
        Integer checkedInDetails,
        Integer completedDetails,
        BigDecimal totalAmount,
        List<AdminCheckInLogDetailResponse> details
) {
}
