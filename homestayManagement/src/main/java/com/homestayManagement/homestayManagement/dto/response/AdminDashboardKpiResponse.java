package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminDashboardKpiResponse(
        BigDecimal totalRevenue,
        BigDecimal roomRevenue,
        BigDecimal serviceRevenue,
        BigDecimal penaltyRevenue,
        Long bookingCount,
        Long occupiedRoomNights,
        Integer totalRooms,
        Double averageOccupancyRate
) {
}
