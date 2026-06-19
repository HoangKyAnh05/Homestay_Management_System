package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record HousekeepingCleaningCompletionRequest(
        @NotNull(message = "Danh sách checklist không được để trống")
        List<@Valid HousekeepingCleaningItemRequest> items
) {
}
