package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminHousekeepingChecklistRequest(
        @NotBlank(message = "Tên checklist không được để trống")
        @Size(max = 120, message = "Tên checklist tối đa 120 ký tự")
        String name,

        boolean active,

        Long version,

        @NotNull(message = "Danh sách hạng mục không được để trống")
        @Size(min = 1, max = 100, message = "Checklist phải có từ 1 đến 100 hạng mục")
        List<@Valid AdminHousekeepingChecklistItemRequest> items
) {
}
