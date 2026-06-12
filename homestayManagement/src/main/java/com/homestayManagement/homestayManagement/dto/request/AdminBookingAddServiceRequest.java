package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminBookingAddServiceRequest(
        @NotBlank(message = "Vui lòng chọn loại dịch vụ")
        String type,

        @NotNull(message = "Vui lòng chọn dịch vụ")
        Long serviceId,

        @NotNull(message = "Vui lòng nhập số lượng")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        Integer quantity
) {
}
