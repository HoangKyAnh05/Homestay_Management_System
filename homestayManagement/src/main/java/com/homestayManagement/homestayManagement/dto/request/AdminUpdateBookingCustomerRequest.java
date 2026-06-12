package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AdminUpdateBookingCustomerRequest(

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Size(max = 10, message = "Số điện thoại tối đa 10 ký tự")
        String phone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        LocalDate dateOfBirth
) {
}
