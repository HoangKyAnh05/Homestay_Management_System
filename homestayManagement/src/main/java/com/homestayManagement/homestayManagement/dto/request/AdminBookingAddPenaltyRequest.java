package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AdminBookingAddPenaltyRequest(
        @NotNull(message = "Vui lòng chọn khoản phạt")
        Long rulesPenaltyId,

        @NotNull(message = "Vui lòng nhập số tiền phạt")
        @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền phạt phải lớn hơn 0")
        BigDecimal amount,

        String description
) {
}
