package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PublicSePayBookingPaymentRequest(
        @NotBlank(message = "Vui long nhap email dat phong")
        @Email(message = "Email khong hop le")
        String email
) {
}
