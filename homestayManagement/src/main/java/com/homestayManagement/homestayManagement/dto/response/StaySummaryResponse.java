package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record StaySummaryResponse(
        Long accessId,
        String accessStatus,
        Long bookingId,
        String bookingCode,
        Long bookingDetailId,
        Long roomId,
        String roomNumber,
        String roomTypeName,
        String representativeName,
        LocalDateTime actualCheckIn,
        LocalDateTime checkOutTarget,
        List<StayServiceUsageResponse> services
) {
}
