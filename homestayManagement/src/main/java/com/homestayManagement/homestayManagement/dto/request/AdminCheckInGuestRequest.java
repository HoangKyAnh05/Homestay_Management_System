package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdminCheckInGuestRequest(
        @NotBlank(message = "Tên người lưu trú không được để trống")
        @Size(max = 100, message = "Tên người lưu trú tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Căn cước công dân không được để trống")
        @Pattern(regexp = "^\\d{12}$", message = "Căn cước công dân phải gồm đúng 12 chữ số")
        String identityDocumentNumber,

        LocalDate dateOfBirth,

        @Email(message = "Email người lưu trú không hợp lệ")
        @Size(max = 100, message = "Email tối đa 100 ký tự")
        String email,

        @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải gồm đúng 10 chữ số")
        String phone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @Size(max = 20, message = "Giới tính tối đa 20 ký tự")
        String gender,

        @Size(max = 50, message = "Quốc tịch tối đa 50 ký tự")
        String nationality
) {
}
