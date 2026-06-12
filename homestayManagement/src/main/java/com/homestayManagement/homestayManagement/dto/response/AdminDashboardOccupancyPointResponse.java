package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;

public record AdminDashboardOccupancyPointResponse(
        LocalDate date,
        Integer occupiedRooms,
        Integer totalRooms,
        Double occupancyRate
) {
}
