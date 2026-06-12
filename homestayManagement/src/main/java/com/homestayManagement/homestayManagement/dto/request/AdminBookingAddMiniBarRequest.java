package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AdminBookingAddMiniBarRequest(
        @NotNull(message = "Vui lòng chọn mini-bar")
        Long itemId,

        @NotNull(message = "Vui lòng nhập số lượng")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        Integer quantity
) {
}
