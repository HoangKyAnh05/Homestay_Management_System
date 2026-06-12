package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RoomPriceConfigRequest(

        @NotNull(message = "Loại phòng không được để trống")
        Long roomTypeId,

        @NotNull(message = "Gói thuê không được để trống")
        Long pricePolicyId,

        @NotBlank(message = "Loại ngày không được để trống")
        String dayType,   // WEEKDAY | WEEKEND

        @NotNull(message = "Giá không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
        BigDecimal price
) {
}
