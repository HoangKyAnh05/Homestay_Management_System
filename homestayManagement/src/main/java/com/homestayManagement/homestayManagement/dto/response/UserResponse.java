package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        String address,
        String avatarUrl,
        String role,
        String identityDocumentNumber
) {
}
