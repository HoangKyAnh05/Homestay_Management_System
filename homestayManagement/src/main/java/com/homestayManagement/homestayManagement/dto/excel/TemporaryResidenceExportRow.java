package com.homestayManagement.homestayManagement.dto.excel;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TemporaryResidenceExportRow(
        int index,
        String bookingCode,
        String roomNumber,
        String fullName,
        LocalDate dateOfBirth,
        Integer age,
        String phone,
        String identityDocumentNumber,
        String address,
        LocalDateTime actualCheckIn,
        LocalDateTime expectedCheckOut
) {
}
