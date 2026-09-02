package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RoomIncidentCreateRequest(
        @NotNull(message = "ID phòng không được để trống")
        Long roomId,

        Long bookingDetailId,

        Long housekeepingTaskId,

        @NotBlank(message = "Tên đồ vật không được để trống")
        @Size(max = 255, message = "Tên đồ vật không quá 255 ký tự")
        String itemName,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
        Integer quantity,

        @NotBlank(message = "Loại sự cố không được để trống (DAMAGED hoặc LOST)")
        String incidentType,

        String severity,

        @Size(max = 1000, message = "Mô tả không quá 1000 ký tự")
        String description,

        @Size(max = 500, message = "Đường dẫn ảnh không quá 500 ký tự")
        String evidenceImageUrl,

        @DecimalMin(value = "0.0", message = "Chi phí ước tính không được âm")
        BigDecimal estimatedCost
) {
}
