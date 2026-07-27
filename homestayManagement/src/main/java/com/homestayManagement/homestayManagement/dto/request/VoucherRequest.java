package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VoucherRequest(
        @NotBlank
        @Size(max = 20)
        @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Code chi duoc gom chu cai, so, dau gach duoi hoac gach ngang.")
        String code,

        @NotBlank
        @Pattern(regexp = "^(PERCENT|AMOUNT|percent|amount)$", message = "discountType phai la PERCENT hoac AMOUNT.")
        String discountType,

        @NotNull
        @DecimalMin(value = "0.01", message = "discountValue phai lon hon 0.")
        BigDecimal discountValue,

        @PositiveOrZero
        BigDecimal minOrderValue,

        @PositiveOrZero
        BigDecimal maxDiscountAmount,

        LocalDateTime startDate,

        LocalDateTime endDate,

        @PositiveOrZero
        Integer usageLimit
) {
}
