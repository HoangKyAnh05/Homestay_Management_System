package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RoomIncidentCompensationRequest(
        @NotBlank(message = "Bên chịu trách nhiệm không được để trống (CUSTOMER, HOMESTAY, NONE)")
        String liability,

        @DecimalMin(value = "0.0", message = "Số tiền bồi thường không được âm")
        BigDecimal compensationAmount,

        Boolean chargeToInvoice,

        @Size(max = 1000, message = "Ghi chú xử lý không quá 1000 ký tự")
        String adminNotes
) {
}
