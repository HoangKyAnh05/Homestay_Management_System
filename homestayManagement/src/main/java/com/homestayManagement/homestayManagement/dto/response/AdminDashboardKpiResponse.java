package com.homestayManagement.homestayManagement.dto.response;

import java.math.BigDecimal;

public record AdminDashboardKpiResponse(
        BigDecimal totalRevenue,
        BigDecimal roomRevenue,
        BigDecimal serviceRevenue,
        BigDecimal penaltyRevenue,
        BigDecimal maintenanceExpense,
        Long bookingCount,
        Long occupiedRoomNights,
        Integer totalRooms,
        Double averageOccupancyRate
) {
    public AdminDashboardKpiResponse(
            BigDecimal totalRevenue,
            BigDecimal roomRevenue,
            BigDecimal serviceRevenue,
            BigDecimal penaltyRevenue,
            Long bookingCount,
            Long occupiedRoomNights,
            Integer totalRooms,
            Double averageOccupancyRate
    ) {
        this(totalRevenue, roomRevenue, serviceRevenue, penaltyRevenue, BigDecimal.ZERO, bookingCount, occupiedRoomNights, totalRooms, averageOccupancyRate);
    }
}

