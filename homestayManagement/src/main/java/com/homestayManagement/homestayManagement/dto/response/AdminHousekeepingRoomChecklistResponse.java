package com.homestayManagement.homestayManagement.dto.response;

public record AdminHousekeepingRoomChecklistResponse(
        Long roomId,
        String roomNumber,
        boolean hasOverride,
        AdminHousekeepingChecklistTemplateResponse overrideTemplate
) {
}
