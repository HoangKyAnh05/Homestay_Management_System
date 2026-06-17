package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AdminCheckInPreparationResponse(
        Long bookingId,
        Long bookingDetailId,
        String roomTypeName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Integer numberOfAdults,
        Integer numberOfChildren,
        AdminBookingCustomerResponse customer,
        String customerIdentityDocumentNumber,
        List<AdminBookingRoomResponse> availableRooms
) {
}
