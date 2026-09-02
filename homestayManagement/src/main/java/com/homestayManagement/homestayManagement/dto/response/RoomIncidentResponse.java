package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RoomIncidentResponse(
        Long id,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        Long bookingDetailId,
        String bookingCode,
        String customerName,
        String customerPhone,
        Long housekeepingTaskId,
        Long reportedById,
        String reportedByName,
        Long handledById,
        String handledByName,
        String itemName,
        Integer quantity,
        String incidentType,
        String severity,
        String description,
        String evidenceImageUrl,
        String status,
        String liability,
        BigDecimal estimatedCost,
        BigDecimal compensationAmount,
        String adminNotes,
        LocalDateTime reportedAt,
        LocalDateTime resolvedAt
) {
}
