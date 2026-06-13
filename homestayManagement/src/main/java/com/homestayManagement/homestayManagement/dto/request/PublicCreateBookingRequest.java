package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PublicCreateBookingRequest(
        @NotBlank(message = "Vui lòng nhập họ tên")
        String fullName,

        @NotBlank(message = "Vui lòng nhập số điện thoại")
        String phone,

        @Email(message = "Email không hợp lệ")
        String email,

        String address,

        LocalDate dateOfBirth,

        Long roomId,

        List<@Valid PublicBookingRoomRequest> rooms,

        @NotNull(message = "Vui lòng chọn giờ nhận phòng")
        LocalDateTime checkInTarget,

        @NotNull(message = "Vui lòng chọn giờ trả phòng")
        LocalDateTime checkOutTarget,

        @NotNull(message = "Vui lòng chọn gói thuê")
        Long pricePolicyId,

        @NotNull(message = "Vui lòng nhập số người lớn")
        @Min(value = 1, message = "Số người lớn phải lớn hơn 0")
        Integer numberOfAdults,

        @NotNull(message = "Vui lòng nhập số trẻ em")
        @Min(value = 0, message = "Số trẻ em không hợp lệ")
        Integer numberOfChildren,

        List<@Valid PublicBookingServiceRequest> services
) {
}
