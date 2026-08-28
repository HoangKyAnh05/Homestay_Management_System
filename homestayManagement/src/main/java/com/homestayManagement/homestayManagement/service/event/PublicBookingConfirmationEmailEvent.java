package com.homestayManagement.homestayManagement.service.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PublicBookingConfirmationEmailEvent(
        String email,
        String fullName,
        String bookingCode,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        BigDecimal roomCharge,
        BigDecimal serviceCharge,
        BigDecimal totalAmount,
        boolean requiresDeposit,
        BigDecimal depositAmount,
        boolean paymentConfirmed,
        List<RoomLine> rooms
) {
    public record RoomLine(
            String roomTypeName,
            Integer numberOfAdults,
            Integer numberOfChildren,
            BigDecimal finalRoomAmount
    ) {
    }
}
