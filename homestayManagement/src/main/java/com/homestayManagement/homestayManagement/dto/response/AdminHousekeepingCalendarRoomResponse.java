package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminHousekeepingCalendarRoomResponse(
        Long roomId,
        String roomNumber,
        Long roomTypeId,
        String roomTypeName,
        String currentStatus,
        List<AdminHousekeepingCalendarDayResponse> days
) {
}
