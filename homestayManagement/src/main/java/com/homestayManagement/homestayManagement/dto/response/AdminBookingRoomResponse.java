package com.homestayManagement.homestayManagement.dto.response;

public record AdminBookingRoomResponse(
        Long id,
        String roomNumber,
        String roomTypeName
) {
}
