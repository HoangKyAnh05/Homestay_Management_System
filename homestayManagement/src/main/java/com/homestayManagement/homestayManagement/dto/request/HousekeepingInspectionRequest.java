package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record HousekeepingInspectionRequest(
        @NotNull(message = "Danh sách mini-bar không được để trống")
        List<@Valid HousekeepingInspectionItemRequest> items,

        @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
        String note
) {
}
