package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

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
        Integer numberOfChildren,

        String guestName,

        String guestEmail,

        String guestPhone,

        List<@Valid PublicBookingServiceRequest> services
) {
    public PublicBookingRoomRequest(
            Long roomId,
            Long roomTypeId,
            Integer quantity,
            Integer numberOfAdults,
            Integer numberOfChildren,
            List<PublicBookingServiceRequest> services
    ) {
        this(roomId, roomTypeId, quantity, numberOfAdults, numberOfChildren, null, null, null, services);
    }
}
