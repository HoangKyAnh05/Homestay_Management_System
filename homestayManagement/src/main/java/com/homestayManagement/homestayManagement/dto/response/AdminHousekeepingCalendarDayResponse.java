package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminHousekeepingCalendarDayResponse(
        LocalDate date,
        String status,
        Long bookingId,
        Long bookingDetailId,
        String customerName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        Long housekeepingTaskId,
        String assignedHousekeepingName,
        Integer checklistCompleted,
        Integer checklistTotal,
        String note
) {
}
