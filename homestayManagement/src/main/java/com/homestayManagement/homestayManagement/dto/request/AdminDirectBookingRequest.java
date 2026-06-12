package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminDirectBookingRequest(
        @NotBlank(message = "Vui lòng nhập họ tên khách hàng")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        @NotBlank(message = "Vui lòng nhập số điện thoại")
        @Size(max = 10, message = "Số điện thoại không được vượt quá 10 ký tự")
        String phone,

        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 50, message = "Email không được vượt quá 50 ký tự")
        String email,

        @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
        String address,

        LocalDate dateOfBirth,

        @NotNull(message = "Vui lòng chọn phòng")
        Long roomId,

        @NotNull(message = "Vui lòng chọn giờ nhận phòng")
        LocalDateTime checkInTarget,

        @NotNull(message = "Vui lòng chọn giờ trả phòng")
        LocalDateTime checkOutTarget,

        @NotNull(message = "Vui lòng nhập số người lớn")
        @Min(value = 1, message = "Số người lớn tối thiểu là 1")
        Integer numberOfAdults,

        @NotNull(message = "Vui lòng nhập số trẻ em")
        @Min(value = 0, message = "Số trẻ em không hợp lệ")
        Integer numberOfChildren,

        @NotBlank(message = "Vui lòng chọn loại thuê")
        @Size(max = 20, message = "Loại thuê không được vượt quá 20 ký tự")
        String rentType
) {
}
