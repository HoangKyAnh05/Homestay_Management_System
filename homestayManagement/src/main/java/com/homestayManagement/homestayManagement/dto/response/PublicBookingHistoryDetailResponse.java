package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PublicBookingHistoryDetailResponse(
        Long bookingId,
        String bookingCode,
        LocalDateTime bookingDate,
        String status,
        String voucherCode,
        String voucherDiscountType,
        BigDecimal voucherDiscountValue,
        BigDecimal memberDiscountPercent,
        BigDecimal memberDiscountAmount,
        Integer earnedMemberPoints,
        BigDecimal roomChargeBeforeDiscount,
        BigDecimal roomDiscountAmount,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        boolean requiresPayment,
        String depositPolicyName,
        String depositCalculationType,
        BigDecimal depositPolicyValue,
        BigDecimal depositAmount,
        boolean customerConfirmed,
        String customerFeedback,
        LocalDateTime customerFeedbackAt,
        List<PublicBookingHistoryRoomResponse> rooms,
        List<PublicBookingHistoryServiceResponse> services
) {
}
