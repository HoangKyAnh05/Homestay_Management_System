package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @Email(message = "Email không đúng định dạng")
        @NotBlank(message = "Email không được để trống")
        String email
) {
}
