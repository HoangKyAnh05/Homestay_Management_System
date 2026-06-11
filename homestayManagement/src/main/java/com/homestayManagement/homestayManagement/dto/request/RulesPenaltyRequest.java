package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RulesPenaltyRequest(
        @NotBlank(message = "Nội quy không được để trống")
        @Size(max = 255, message = "Nội quy tối đa 255 ký tự")
        String title,

        @NotNull(message = "Mức phạt không được để trống")
        @DecimalMin(value = "0.0", inclusive = true, message = "Mức phạt không được âm")
        BigDecimal penaltyAmount
) {
}
