package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminHousekeepingRoomTypeChecklistResponse(
        Long roomTypeId,
        String roomTypeName,
        AdminHousekeepingChecklistTemplateResponse defaultTemplate,
        List<AdminHousekeepingRoomChecklistResponse> rooms
) {
}
