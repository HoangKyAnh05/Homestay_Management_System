package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AdminCompleteCheckInRequest(
        @NotNull(message = "Vui lòng chọn phòng")
        Long roomId,

        @NotEmpty(message = "Vui lòng nhập thông tin người lưu trú")
        List<@Valid AdminCheckInGuestRequest> guests
) {
}
