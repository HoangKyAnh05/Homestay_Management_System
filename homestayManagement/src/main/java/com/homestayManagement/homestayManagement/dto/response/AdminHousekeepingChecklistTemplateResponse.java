package com.homestayManagement.homestayManagement.dto.response;

import java.util.List;

public record AdminHousekeepingChecklistTemplateResponse(
        Long id,
        String name,
        boolean active,
        Long version,
        Long roomTypeId,
        Long roomId,
        List<AdminHousekeepingChecklistItemResponse> items
) {
}
