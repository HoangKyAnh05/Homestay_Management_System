package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminDirectBookingServiceRequest(
        @NotBlank(message = "Vui lòng chọn loại dịch vụ")
        @Size(max = 20, message = "Loại dịch vụ không hợp lệ")
        String type,

        @NotNull(message = "Vui lòng chọn dịch vụ")
        Long serviceId,

        @NotNull(message = "Vui lòng nhập số lượng dịch vụ")
        @Min(value = 1, message = "Số lượng dịch vụ tối thiểu là 1")
        Integer quantity
) {
}
