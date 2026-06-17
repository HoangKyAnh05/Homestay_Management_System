package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminCustomerHistoryRoomResponse(
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        String status,
        String rentType,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        LocalDateTime actualCheckIn,
        LocalDateTime actualCheckOut,
        Integer numberOfAdults,
        Integer numberOfChildren,
        BigDecimal priceAtBooking,
        List<AdminCustomerHistoryServiceResponse> services,
        List<AdminCustomerHistoryGuestResponse> guests
) {
}
