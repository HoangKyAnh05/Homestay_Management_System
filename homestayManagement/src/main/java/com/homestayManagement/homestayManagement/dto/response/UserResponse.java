package com.homestayManagement.homestayManagement.dto.response;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String avatarUrl,
        String role
) {
}
