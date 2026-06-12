package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomTypeRequest(
        @NotBlank(message = "Tên loại phòng không được để trống")
        @Size(max = 100)
        String name,

        // basePrice đã bị loại bỏ — giá được quản lý trong room_price_configs

        @NotNull @Min(value = 1, message = "Số người lớn tối thiểu là 1")
        Integer maxAdults,

        @NotNull @Min(value = 0)
        Integer maxChildren,

        Long depositPolicyId,

        String description
) {
}
