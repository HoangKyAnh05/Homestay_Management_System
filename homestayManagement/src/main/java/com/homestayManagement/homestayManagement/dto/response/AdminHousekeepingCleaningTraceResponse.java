package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AdminHousekeepingCleaningTraceResponse(
        Long roomId,
        String roomNumber,
        Long housekeepingTaskId,
        Long employeeId,
        String employeeName,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        Long durationMinutes,
        String note,
        List<HousekeepingCleaningChecklistItemResponse> checklistItems
) {
}
