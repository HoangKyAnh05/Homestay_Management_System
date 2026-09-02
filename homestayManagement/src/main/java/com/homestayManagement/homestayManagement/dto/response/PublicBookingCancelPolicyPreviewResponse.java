package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicBookingCancelPolicyPreviewResponse(
        Long bookingId,
        String bookingCode,
        LocalDateTime checkInTarget,
        LocalDateTime requestTime,
        double hoursUntilCheckIn,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        Integer refundRate,
        BigDecimal refundAmount,
        String policyDescription,
        boolean eligibleForRefund
) {
}
