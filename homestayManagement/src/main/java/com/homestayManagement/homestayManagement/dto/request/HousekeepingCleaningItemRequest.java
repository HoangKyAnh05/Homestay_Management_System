package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotNull;

public record HousekeepingCleaningItemRequest(
        @NotNull(message = "Hạng mục checklist không hợp lệ")
        Long taskChecklistItemId,

        boolean completed
) {
}
