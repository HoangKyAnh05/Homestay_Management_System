package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RoomMiniBarItemRequest(
        @NotBlank(message = "Tên mặt hàng không được để trống")
        @Size(max = 100, message = "Tên mặt hàng tối đa 100 ký tự")
        String name,

        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0.0", inclusive = true, message = "Giá không được âm")
        BigDecimal price,

        @NotNull(message = "Số lượng tồn kho không được để trống")
        @Min(value = 0, message = "Số lượng tồn kho không được âm")
        Integer quantityInStock
) {
}
