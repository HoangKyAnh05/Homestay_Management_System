package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RoomRequest(
        @NotBlank(message = "Số phòng không được để trống")
        @Size(max = 10)
        String roomNumber,

        @NotNull(message = "Loại phòng không được để trống")
        Long roomTypeId,

        @NotBlank(message = "Trạng thái không được để trống")
        String status
) {
}
