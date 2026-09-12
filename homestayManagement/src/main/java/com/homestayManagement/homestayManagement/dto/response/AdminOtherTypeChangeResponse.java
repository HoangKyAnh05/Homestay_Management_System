package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminOtherTypeChangeResponse(
        Long roomTypeId,
        String roomTypeName,
        Integer maxAdults,
        Integer maxChildren,
        List<AdminChangeRoomItemResponse> availableRooms
) {}
