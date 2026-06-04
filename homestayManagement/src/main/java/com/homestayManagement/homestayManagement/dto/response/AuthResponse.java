package com.homestayManagement.homestayManagement.dto.response;

public record AuthResponse(
        String tokenType,
        String accessToken,
        UserResponse user
) {
}
