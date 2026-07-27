package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;

public record IdentityOcrResponse(
        String fullName,
        String identityDocumentNumber,
        LocalDate dateOfBirth,
        String gender,
        String nationality,
        String address,
        LocalDate issueDate,
        String issuePlace,
        String documentType,
        Double confidence
) {
}
