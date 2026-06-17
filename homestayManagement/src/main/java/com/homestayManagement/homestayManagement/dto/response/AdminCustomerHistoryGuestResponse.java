package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;

public record AdminCustomerHistoryGuestResponse(
        Long id,
        String fullName,
        String identityDocumentType,
        String identityDocumentNumber,
        LocalDate dateOfBirth,
        String gender,
        String nationality,
        String phone,
        String address,
        boolean primaryGuest
) {
}
