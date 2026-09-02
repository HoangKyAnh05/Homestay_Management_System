package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PublicBookingCancelRequest(
        @NotBlank(message = "Vui lòng nhập lý do hủy phòng")
        String reason,
        String bankAccountNumber,
        String bankName,
        String accountHolderName,
        String zaloPhone
) {
}
