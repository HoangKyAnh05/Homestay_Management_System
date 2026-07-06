package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminCompleteCheckInRequest(
        @NotNull(message = "Vui lòng chọn phòng")
        Long roomId,

        @NotBlank(message = "Vui lòng nhập email người đại diện phòng")
        @Email(message = "Email người đại diện phòng không hợp lệ")
        @Size(max = 50, message = "Email người đại diện tối đa 50 ký tự")
        String representativeEmail,

        @NotEmpty(message = "Vui lòng nhập thông tin người lưu trú")
        List<@Valid AdminCheckInGuestRequest> guests
) {
}
