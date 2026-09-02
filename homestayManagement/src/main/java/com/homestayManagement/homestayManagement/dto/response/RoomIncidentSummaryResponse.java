package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record RoomIncidentSummaryResponse(
        long totalIncidents,
        long reportedCount,
        long inProgressCount,
        long resolvedCount,
        long damagedCount,
        long lostCount,
        long maintenanceCount,
        BigDecimal totalCompensationAmount
) {
}
