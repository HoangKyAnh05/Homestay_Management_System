package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Email không được để trống")
        @Pattern(
                regexp = "^(?!.*\\.\\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                message = "Email không hợp lệ (Ví dụ: user@example.com)"
        )
        String email,

        @Pattern(regexp = "^\\d{10}$", message = "Số điện thoại phải đúng 10 chữ số")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:,.<>?])\\S{8,64}$",
                message = "Mật khẩu phải từ 8-64 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt, không chứa khoảng trắng."
        )
        String password
) {
        public RegisterRequest {
                fullName = fullName != null ? fullName.trim() : null;
                email = email != null ? email.trim() : null;
                phone = phone != null ? phone.trim() : null;
        }
}
