package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PublicBookingRoomRequest(
        @NotNull(message = "Vui lòng chọn phòng")
        Long roomId,

        @NotNull(message = "Vui lòng nhập số người lớn")
        @Min(value = 1, message = "Số người lớn phải lớn hơn 0")
        Integer numberOfAdults,

        @NotNull(message = "Vui lòng nhập số trẻ em")
        @Min(value = 0, message = "Số trẻ em không hợp lệ")
        Integer numberOfChildren
) {
}
