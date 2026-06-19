package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminHousekeepingChecklistItemRequest(
        @NotBlank(message = "Tên hạng mục không được để trống")
        @Size(max = 200, message = "Tên hạng mục tối đa 200 ký tự")
        String title,

        @Size(max = 500, message = "Mô tả hạng mục tối đa 500 ký tự")
        String description,

        boolean required,
        boolean active
) {
}
