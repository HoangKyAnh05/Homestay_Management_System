package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdminDirectBookingGuestRequest(
        @NotBlank(message = "Vui lòng nhập tên người lưu trú")
        @Size(max = 100, message = "Tên người lưu trú tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Vui lòng nhập căn cước công dân người lưu trú")
        @Size(max = 30, message = "Căn cước công dân tối đa 30 ký tự")
        String identityDocumentNumber,

        @NotBlank(message = "Vui lòng nhập số điện thoại người lưu trú")
        @Size(max = 15, message = "Số điện thoại người lưu trú tối đa 15 ký tự")
        String phone,

        LocalDate dateOfBirth,

        @Email(message = "Email người lưu trú không hợp lệ")
        @Size(max = 100, message = "Email người lưu trú tối đa 100 ký tự")
        String email,

        @Size(max = 255, message = "Địa chỉ người lưu trú tối đa 255 ký tự")
        String address
) {
}
