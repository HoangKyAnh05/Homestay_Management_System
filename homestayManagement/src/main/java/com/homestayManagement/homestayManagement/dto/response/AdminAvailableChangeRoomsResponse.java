package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record AdminAvailableChangeRoomsResponse(
        Long bookingDetailId,
        Long bookingId,
        String bookingCode,
        String customerName,
        Long currentRoomId,
        String currentRoomNumber,
        Long currentRoomTypeId,
        String currentRoomTypeName,
        LocalDateTime checkInTarget,
        LocalDateTime checkOutTarget,
        boolean hasSameTypeAvailable,
        List<AdminChangeRoomItemResponse> sameTypeRooms,
        List<AdminOtherTypeChangeResponse> otherTypes
) {}
