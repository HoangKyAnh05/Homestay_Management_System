package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record StayQuickLoginRequest(
        @NotBlank(message = "Token truy cập không được để trống")
        String token
) {
}
