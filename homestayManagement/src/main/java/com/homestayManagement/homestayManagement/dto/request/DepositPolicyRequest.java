package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record DepositPolicyRequest(
        @NotBlank(message = "Tên chính sách không được để trống")
        @Size(max = 50)
        String policyName,

        @NotBlank(message = "Cách tính tiền cọc không được để trống")
        String calculationType,

        @NotNull(message = "Giá trị chính sách không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị chính sách phải lớn hơn 0")
        BigDecimal policyValue,

        @Size(max = 255)
        String description
) {
}
