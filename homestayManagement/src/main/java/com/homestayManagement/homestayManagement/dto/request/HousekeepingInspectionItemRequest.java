package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HousekeepingInspectionItemRequest(
        @NotNull(message = "Vui lòng chọn mặt hàng mini-bar")
        Long itemId,

        @NotNull(message = "Vui lòng nhập số lượng đã sử dụng")
        @Min(value = 0, message = "Số lượng đã sử dụng không được âm")
        Integer quantityUsed
) {
}
