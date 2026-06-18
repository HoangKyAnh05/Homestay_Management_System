package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record HousekeepingTaskResponse(
        Long id,
        Long version,
        Long bookingId,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomStatus,
        String customerName,
        String customerPhone,
        LocalDateTime checkOutTarget,
        String inspectionStatus,
        String cleaningStatus,
        Long requestedById,
        String requestedByName,
        Long assignedHousekeepingId,
        String assignedHousekeepingName,
        String note,
        LocalDateTime requestedAt,
        LocalDateTime startedAt,
        LocalDateTime inspectionCompletedAt,
        LocalDateTime cleaningCompletedAt,
        BigDecimal totalMiniBarCharge,
        List<HousekeepingMiniBarItemResponse> miniBarItems
) {
}
