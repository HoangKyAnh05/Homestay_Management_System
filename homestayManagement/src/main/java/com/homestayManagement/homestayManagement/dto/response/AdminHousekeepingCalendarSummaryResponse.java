package com.homestayManagement.homestayManagement.dto.response;

public record AdminHousekeepingCalendarSummaryResponse(
        int available,
        int booked,
        int occupied,
        int cleaning,
        int maintenance
) {
}
