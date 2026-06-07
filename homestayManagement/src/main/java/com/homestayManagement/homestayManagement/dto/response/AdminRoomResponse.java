package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminRoomResponse(
        Long id,
        String roomNumber,
        String status,
        Long roomTypeId,
        String roomTypeName,
        List<RoomImageResponse> images
) {
}
