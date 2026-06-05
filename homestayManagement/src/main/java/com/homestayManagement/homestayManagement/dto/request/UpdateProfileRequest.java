package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequest(
        @NotBlank(message = "Ho ten khong duoc de trong")
        @Size(max = 100, message = "Ho ten toi da 100 ky tu")
        String fullName,

        @Size(max = 15, message = "So dien thoai toi da 15 ky tu")
        String phone,

        LocalDate dateOfBirth,

        @Size(max = 255, message = "Dia chi toi da 255 ky tu")
        String address
) {
}
