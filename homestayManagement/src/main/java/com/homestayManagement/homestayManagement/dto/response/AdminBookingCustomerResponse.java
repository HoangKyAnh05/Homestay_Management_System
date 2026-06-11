package com.homestayManagement.homestayManagement.dto.response;

import java.time.LocalDate;

public record AdminBookingCustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        LocalDate dateOfBirth
) {
}
