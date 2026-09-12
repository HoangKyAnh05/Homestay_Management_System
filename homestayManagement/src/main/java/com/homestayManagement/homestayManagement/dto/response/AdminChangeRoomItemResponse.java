package com.homestayManagement.homestayManagement.dto.response;

public record AdminChangeRoomItemResponse(
        Long roomId,
        String roomNumber,
        String status,
        String roomTypeName,
        Long roomTypeId
) {}
