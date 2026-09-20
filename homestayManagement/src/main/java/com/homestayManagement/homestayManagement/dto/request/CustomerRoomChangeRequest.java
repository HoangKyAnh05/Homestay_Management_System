package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CustomerRoomChangeRequest(
        @NotBlank(message = "Mã đơn đặt phòng không được để trống")
        String bookingCode,

        String phone,

        @NotBlank(message = "Vui lòng chọn lý do đổi phòng")
        String reason,

        String note,

        String preferredRoomTypeName
) {}
