package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String avatarUrl,
        String role,
        Long roleId,
        boolean isActive,
        boolean isVerified,
        LocalDateTime createdAt
) {
}
