package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PublicBookingRoomRequest(
        Long roomId,

        Long roomTypeId,

        @Min(value = 1, message = "So luong phong phai lon hon 0")
        Integer quantity,

        @NotNull(message = "Vui long nhap so nguoi lon")
        @Min(value = 1, message = "So nguoi lon phai lon hon 0")
        Integer numberOfAdults,

        @NotNull(message = "Vui long nhap so tre em")
        @Min(value = 0, message = "So tre em khong hop le")
        Integer numberOfChildren
) {
}
