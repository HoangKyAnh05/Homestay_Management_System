package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.util.List;

public record AdminHousekeepingCalendarResponse(
        LocalDate startDate,
        LocalDate endDate,
        AdminHousekeepingCalendarSummaryResponse summary,
        List<AdminHousekeepingCalendarRoomResponse> rooms
) {
}
