package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record FacilityServiceRequest(
        @NotBlank(message = "Tên dịch vụ không được để trống")
        @Size(max = 100, message = "Tên dịch vụ tối đa 100 ký tự")
        String name,

        @NotNull(message = "Giá dịch vụ không được để trống")
        @DecimalMin(value = "0.0", inclusive = true, message = "Giá dịch vụ không được âm")
        BigDecimal price,

        @NotNull(message = "Trạng thái không được để trống")
        Boolean isActive
) {
}
