package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PublicBookingResponse(
        Long bookingId,
        String bookingCode,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String status,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
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
        List<PublicBookingRoomResponse> rooms,
        boolean requiresDeposit,
        String depositPolicyName,
        String depositCalculationType,
        BigDecimal depositPolicyValue,
        BigDecimal depositAmount,
        String luckyVoucherCode,
        BigDecimal luckyVoucherDiscountPercent,
        LocalDateTime luckyVoucherEndDate
) {
}
