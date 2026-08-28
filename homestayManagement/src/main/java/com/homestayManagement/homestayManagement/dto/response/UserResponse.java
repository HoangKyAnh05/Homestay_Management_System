package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;
import java.math.BigDecimal;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        String address,
        String avatarUrl,
        String role,
        String identityDocumentNumber,
        Integer memberPoints,
        BigDecimal memberDiscountPercent
) {
}
