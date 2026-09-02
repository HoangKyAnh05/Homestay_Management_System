package com.homestayManagement.homestayManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoomIncidentStatusUpdateRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        String status,

        @Size(max = 1000, message = "Ghi chú xử lý không quá 1000 ký tự")
        String adminNotes
) {
}
