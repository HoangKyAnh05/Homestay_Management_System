package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.util.List;

public record AdminBookingScheduleResponse(
        LocalDate weekStart,
        LocalDate weekEnd,
        LocalDate today,
        List<AdminBookingRoomResponse> rooms,
        List<AdminBookingScheduleItemResponse> bookings
) {
}
