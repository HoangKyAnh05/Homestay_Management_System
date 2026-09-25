package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record AdminCheckoutPaymentRequest(
        @NotBlank(message = "Vui lòng chọn phương thức thanh toán")
        String paymentMethod,

        BigDecimal amount
) {
    public AdminCheckoutPaymentRequest(String paymentMethod) {
        this(paymentMethod, null);
    }
}
