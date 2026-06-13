package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PublicBookingServiceRequest(
        @NotBlank(message = "Loại dịch vụ không hợp lệ")
        String type,

        @NotNull(message = "Vui lòng chọn dịch vụ")
        Long serviceId,

        @NotNull(message = "Vui lòng nhập số lượng dịch vụ")
        @Min(value = 1, message = "Số lượng dịch vụ phải lớn hơn 0")
        Integer quantity
) {
}
