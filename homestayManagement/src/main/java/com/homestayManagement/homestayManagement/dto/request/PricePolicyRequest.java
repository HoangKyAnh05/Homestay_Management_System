package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record PricePolicyRequest(

        @NotBlank(message = "Tên gói thuê không được để trống")
        @Size(max = 50, message = "Tên gói thuê tối đa 50 ký tự")
        String policyName,

        @NotBlank(message = "Loại hình thuê không được để trống")
        String rentType,          // OVERNIGHT | HOURLY | COMBO | DAILY

        LocalTime standardCheckIn,

        LocalTime standardCheckOut,

        Integer limitHours        // chỉ bắt buộc khi rentType = COMBO
) {
}
