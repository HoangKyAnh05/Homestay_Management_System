package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.util.List;

public record AdminDashboardSummaryResponse(
        LocalDate fromDate,
        LocalDate toDate,
        AdminDashboardKpiResponse kpis,
        List<AdminDashboardRevenuePointResponse> revenueTrend,
        List<AdminDashboardOccupancyPointResponse> occupancyTrend,
        List<AdminDashboardNameValueResponse> bookingStatusBreakdown,
        List<AdminDashboardNameValueResponse> revenueBreakdown,
        List<AdminDashboardNameValueResponse> topRooms,
        List<AdminDashboardNameValueResponse> roomTypeBreakdown
) {
}
