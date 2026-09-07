package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminHousekeepingCalendarDayResponse(
        Long roomId,
        LocalDate date,
        String status,
        String bookingStatus,
        String housekeepingStatus,
        Long bookingId,
        String bookingCode,
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
    public AdminHousekeepingCalendarDayResponse(
            LocalDate date,
            String status,
            Long bookingId,
            String bookingCode,
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
        this(null, date, status, status, null, bookingId, bookingCode, bookingDetailId, customerName,
                checkInTarget, checkOutTarget, housekeepingTaskId, assignedHousekeepingName,
                checklistCompleted, checklistTotal, note);
    }
}
