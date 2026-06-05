package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @Email(message = "Email không đúng định dạng")
        @NotBlank(message = "Email không được để trống")
        String email,

        @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
        String password
) {
}
