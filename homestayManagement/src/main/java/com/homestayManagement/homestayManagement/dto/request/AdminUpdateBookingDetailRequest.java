package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AdminUpdateBookingDetailRequest(

        @NotNull(message = "Giờ nhận phòng không được để trống")
        LocalDateTime checkInTarget,

        @NotNull(message = "Giờ trả phòng không được để trống")
        LocalDateTime checkOutTarget,

        @NotNull(message = "Số người lớn không được để trống")
        @Min(value = 1, message = "Số người lớn tối thiểu là 1")
        Integer numberOfAdults,

        @NotNull(message = "Số trẻ em không được để trống")
        @Min(value = 0, message = "Số trẻ em không được âm")
        Integer numberOfChildren,

        /** ID gói thuê mới (nếu muốn đổi — tính lại giá) */
        Long pricePolicyId
) {
}
