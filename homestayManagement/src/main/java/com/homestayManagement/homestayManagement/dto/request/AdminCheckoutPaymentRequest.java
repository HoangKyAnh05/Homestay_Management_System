package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdminCheckoutPaymentRequest(
        @NotBlank(message = "Vui lòng chọn phương thức thanh toán")
        String paymentMethod
) {
}
