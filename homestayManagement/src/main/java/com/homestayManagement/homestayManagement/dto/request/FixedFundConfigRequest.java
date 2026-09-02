package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FixedFundConfigRequest(
        @NotNull(message = "Số tiền quỹ không được để trống")
        @DecimalMin(value = "0.0", message = "Số tiền quỹ phải lớn hơn hoặc bằng 0")
        BigDecimal fundAmount,

        @NotBlank(message = "Vui lòng chọn chế độ tính quỹ đầu ca")
        String fundMode,

        String reason,

        String description
) {
}
