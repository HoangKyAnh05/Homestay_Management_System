package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AddBookingFacilityServiceRequest(
        @NotNull(message = "Vui lòng chọn dịch vụ")
        Long serviceId,

        @NotNull(message = "Vui lòng chọn loại dịch vụ")
        @Pattern(regexp = "FACILITY|INVENTORY", message = "Loại dịch vụ không hợp lệ")
        String type,

        @NotNull(message = "Vui lòng nhập số lượng")
        @Min(value = 1, message = "Số lượng dịch vụ phải lớn hơn 0")
        @Max(value = 20, message = "Mỗi dịch vụ chỉ được chọn tối đa 20 lần")
        Integer quantity
) {
}
